import { Router } from 'express';
import { FILES } from '../lib/paths.js';
import { readJSON } from '../lib/store.js';

export const adsRouter = Router();

// Read-only in Phase 1. The tech-guy phase wires up generation; this just
// surfaces what's already on disk so the Ad Database page works.
adsRouter.get('/', async (_req, res, next) => {
  try { res.json(await readJSON(FILES.ads, [])); } catch (e) { next(e); }
});

adsRouter.get('/:id', async (req, res, next) => {
  try {
    const list = await readJSON(FILES.ads, []);
    const a = list.find((x) => x.id === req.params.id);
    if (!a) return res.status(404).json({ error: 'ad not found' });
    res.json(a);
  } catch (e) { next(e); }
});
