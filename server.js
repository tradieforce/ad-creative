import dotenv from 'dotenv';
// override: true so a stale empty ANTHROPIC_API_KEY in the shell
// doesn't shadow the real key in .env (we hit this on macOS).
dotenv.config({ override: true });
import express from 'express';
import { ASSETS_DIR, UI_DIR } from './server/lib/paths.js';
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

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json({ limit: '5mb' }));
// Master prompt PUT may arrive as raw text/markdown.
app.use(express.text({ type: ['text/*'], limit: '500kb' }));

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

// UI shell.
app.use(express.static(UI_DIR));

// Final error handler — turn validation errors / lookups into clean JSON.
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  const payload = { error: err.message || 'internal error' };
  if (err.details) payload.details = err.details;
  if (status >= 500) console.error('[server]', err);
  res.status(status).json(payload);
});

app.listen(PORT, () => {
  console.log(`[tradie-force-admin] listening on http://localhost:${PORT}`);
});
