// Single-password gate. Set ADMIN_PASSWORD in env (.env locally, Vercel project
// settings in prod). Login posts to /api/auth/login, gets a signed cookie back.
// Subsequent requests must carry the cookie or get a 401.
//
// If ADMIN_PASSWORD is unset (e.g. brand-new local dev), auth is a no-op so
// the existing local workflow keeps working without env churn.

import crypto from 'node:crypto';

const COOKIE_NAME = 'tfa_session';
const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 30;   // 30 days

function secret() {
  // SESSION_SECRET should be set in prod; fall back to ADMIN_PASSWORD-derived
  // for dev so cookies survive restarts without extra env config.
  return process.env.SESSION_SECRET ||
    (process.env.ADMIN_PASSWORD ? 'tfa-dev-' + process.env.ADMIN_PASSWORD : 'tfa-dev-no-secret');
}

function sign(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const mac = crypto.createHmac('sha256', secret()).update(data).digest('base64url');
  return `${data}.${mac}`;
}

function verify(token) {
  if (!token || !token.includes('.')) return null;
  const [data, mac] = token.split('.');
  const expected = crypto.createHmac('sha256', secret()).update(data).digest('base64url');
  if (!crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch { return null; }
}

export function loginHandler(req, res) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return res.status(503).json({ error: 'ADMIN_PASSWORD is not configured on the server' });
  }
  const provided = (req.body && req.body.password) || '';
  if (provided !== expected) {
    return res.status(401).json({ error: 'wrong password' });
  }
  const token = sign({
    sub: 'admin',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + COOKIE_MAX_AGE_SEC,
  });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE_SEC * 1000,
  });
  res.json({ ok: true });
}

export function logoutHandler(_req, res) {
  res.clearCookie(COOKIE_NAME);
  res.json({ ok: true });
}

export function authMiddleware(req, res, next) {
  // Local dev convenience: if ADMIN_PASSWORD is unset, skip the gate entirely.
  if (!process.env.ADMIN_PASSWORD) return next();

  // Allow the login page itself + login API + health check + static UI assets.
  const p = req.path;
  if (p === '/' || p === '/login' || p === '/login.html' || p.startsWith('/login.') ||
      p === '/styles.css' || p === '/app.js' || p === '/index.html' ||
      p === '/api/health' || p === '/api/auth/login' || p === '/api/auth/logout' ||
      p.startsWith('/assets/') || p.startsWith('/_next/') || p.startsWith('/favicon')) {
    return next();
  }

  const token = req.cookies && req.cookies[COOKIE_NAME];
  const payload = verify(token);
  if (!payload) {
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ error: 'auth required', login: '/login' });
    }
    return res.redirect('/login');
  }
  req.user = payload;
  next();
}
