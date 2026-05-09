import { join } from 'node:path';
import dotenv from 'dotenv';
// override: true so a stale empty ANTHROPIC_API_KEY in the shell
// doesn't shadow the real key in .env (we hit this on macOS).
// On Vercel, env comes from project settings — dotenv.config() is a no-op
// when no .env file exists.
dotenv.config({ override: true });
import express from 'express';
import cookieParser from 'cookie-parser';
import { ASSETS_DIR, UI_DIR } from './server/lib/paths.js';
import { authMiddleware, loginHandler, logoutHandler } from './server/lib/auth.js';
import { archetypeRouter } from './server/routes/archetypes.js';
import { globalRulesRouter } from './server/routes/globalRules.js';
import { componentsRouter } from './server/routes/components.js';
import { clientsRouter } from './server/routes/clients.js';
import { adsRouter } from './server/routes/ads.js';
import { pricesRouter } from './server/routes/prices.js';
import { masterPromptRouter } from './server/routes/masterPrompt.js';
import { goldsRouter } from './server/routes/golds.js';
import { generateRouter } from './server/routes/generate.js';
import { editsRouter } from './server/routes/edits.js';
import { packsRouter } from './server/routes/packs.js';
import { reviewRouter } from './server/routes/review.js';
import { cronRouter } from './server/routes/cron.js';
import { spendRouter } from './server/routes/spend.js';
import { initSentry, sentryErrorMiddleware } from './server/lib/sentry.js';

await initSentry();

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json({ limit: '50mb' }));   // canvas-editor flattens can be large
// Master prompt PUT may arrive as raw text/markdown.
app.use(express.text({ type: ['text/*'], limit: '500kb' }));
app.use(cookieParser());

// Public auth endpoints — no gating.
app.post('/api/auth/login', loginHandler);
app.post('/api/auth/logout', logoutHandler);
app.get('/api/health', (_req, res) => res.json({ ok: true, at: new Date().toISOString() }));

// /login → serve the login HTML. Vercel's vercel.json rewrites handle this
// in prod, but locally Express needs an explicit route.
app.get('/login', (_req, res, next) => {
  res.sendFile(join(UI_DIR, 'login.html'), (err) => { if (err) next(err); });
});

// Everything below this is gated by ADMIN_PASSWORD if set.
app.use(authMiddleware);

app.use('/api/archetypes', archetypeRouter);
app.use('/api/global-rules', globalRulesRouter);
app.use('/api/components', componentsRouter);
app.use('/api/clients', clientsRouter);
app.use('/api/ads', adsRouter);
app.use('/api/prices', pricesRouter);
app.use('/api/master-prompt', masterPromptRouter);
app.use('/api/golds', goldsRouter);
app.use('/api/generate', generateRouter);
app.use('/api/edits', editsRouter);
app.use('/api/packs', packsRouter);
app.use('/api/review', reviewRouter);
app.use('/api/cron', cronRouter);
app.use('/api/spend', spendRouter);

// Static assets.
app.use('/assets', express.static(ASSETS_DIR, {
  fallthrough: true,
  // Reference ads change in place; defeat caching for them.
  setHeaders(res, path) {
    if (path.includes('/reference-ads/') || path.includes('/components/') ||
        path.includes('/client-uploads/')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  },
}));

// UI shell — in production Vercel serves /public statically and never reaches here.
// Locally, this serves the same files for parity.
app.use(express.static(UI_DIR));

// Sentry error reporter (no-op when SENTRY_DSN unset).
app.use(sentryErrorMiddleware);

// Final error handler — turn validation errors / lookups into clean JSON.
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  const payload = { error: err.message || 'internal error' };
  if (err.details) payload.details = err.details;
  if (status >= 500) console.error('[server]', err);
  res.status(status).json(payload);
});

// Only listen when run directly (e.g. `npm start`).
// On Vercel, this module is imported by api/index.js and `app` is exported.
import { fileURLToPath } from 'node:url';
const __isMain = fileURLToPath(import.meta.url) === process.argv[1];
if (__isMain) {
  app.listen(PORT, () => {
    console.log(`[tradie-force-admin] listening on http://localhost:${PORT}`);
  });
}

export default app;
