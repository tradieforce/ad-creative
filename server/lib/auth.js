// Single-user gate. Requires BOTH the configured email and password to match.
// Login posts to /api/auth/login, gets a signed cookie back. Subsequent
// requests must carry the cookie or get a 401 (or be redirected to /login).
//
// Required env (both must be set in prod):
//   ADMIN_EMAIL     — the only email allowed to log in
//   ADMIN_PASSWORD  — the matching password (single-quote in .env if it
//                     contains $ to prevent shell/dotenv interpolation)
//   SESSION_SECRET  — random ≥32 char string used to sign session cookies
//
// If ADMIN_EMAIL or ADMIN_PASSWORD is unset locally, auth is a no-op so
// `npm start` keeps working without env churn during development.

import crypto from 'node:crypto';

const COOKIE_NAME = 'tfa_session';
const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 30;   // 30 days

function configured() {
  return !!(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD);
}

function secret() {
  // SESSION_SECRET should be set in prod; fall back to a derivation in dev so
  // cookies survive restarts without extra env config.
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
  // Length-safe + constant-time compare; mismatched lengths skip the compare.
  if (Buffer.from(mac).length !== Buffer.from(expected).length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch { return null; }
}

// Constant-time string compare so attackers can't time-side-channel the
// password / email values.
function ctEq(a, b) {
  const ab = Buffer.from(String(a || ''));
  const bb = Buffer.from(String(b || ''));
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export function loginHandler(req, res) {
  if (!configured()) {
    return res.status(503).json({ error: 'ADMIN_EMAIL / ADMIN_PASSWORD not configured on the server' });
  }
  const providedEmail = ((req.body && req.body.email) || '').trim().toLowerCase();
  const providedPassword = (req.body && req.body.password) || '';
  const expectedEmail = process.env.ADMIN_EMAIL.trim().toLowerCase();
  const expectedPassword = process.env.ADMIN_PASSWORD;

  // Compare both sides regardless of which is wrong — same response, same
  // timing — so the form can't enumerate valid emails.
  const emailOk = ctEq(providedEmail, expectedEmail);
  const passwordOk = ctEq(providedPassword, expectedPassword);
  if (!emailOk || !passwordOk) {
    return res.status(401).json({ error: 'wrong email or password' });
  }

  const token = sign({
    sub: providedEmail,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + COOKIE_MAX_AGE_SEC,
  });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE_SEC * 1000,
  });
  res.json({ ok: true, email: providedEmail });
}

export function logoutHandler(_req, res) {
  res.clearCookie(COOKIE_NAME);
  res.json({ ok: true });
}

export function authMiddleware(req, res, next) {
  // Local dev convenience: if not fully configured, skip the gate entirely.
  if (!configured()) return next();

  // Allow the login page itself + login API + health check + static UI assets.
  const p = req.path;
  if (p === '/login' || p === '/login.html' || p.startsWith('/login.') ||
      p === '/styles.css' || p === '/favicon.ico' ||
      p === '/api/health' || p === '/api/auth/login' || p === '/api/auth/logout' ||
      p.startsWith('/_next/') || p.startsWith('/favicon')) {
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
