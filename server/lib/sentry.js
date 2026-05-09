// Optional Sentry error tracking. No-op when SENTRY_DSN unset (free for single-user).
//
// To enable:
//   1. Sign up at sentry.io (free tier covers 50k events/mo — way more than we need)
//   2. Create a Node.js project, copy the DSN
//   3. Set SENTRY_DSN in .env / Vercel env vars
//
// Captures unhandled errors from Express middleware + manually-reported issues.

let _sentry = null;

export async function initSentry() {
  if (!process.env.SENTRY_DSN) return null;
  try {
    const Sentry = await import('@sentry/node');
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: 0.1,
    });
    _sentry = Sentry;
    console.log('[sentry] enabled');
    return Sentry;
  } catch (e) {
    console.warn('[sentry] init failed:', e.message, '— install @sentry/node to enable');
    return null;
  }
}

export function reportError(err, ctx = {}) {
  if (!_sentry) return;
  try { _sentry.captureException(err, { extra: ctx }); } catch { /* swallow */ }
}

// Express error handler — wires unhandled errors to Sentry while keeping the
// existing JSON-error response shape intact.
export function sentryErrorMiddleware(err, _req, _res, next) {
  reportError(err);
  next(err);
}
