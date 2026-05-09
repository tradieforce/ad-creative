import { Router } from 'express';
import { db } from '../lib/db.js';

export const adsRouter = Router();

adsRouter.get('/', async (_req, res, next) => {
  try { res.json(await db.listAds()); } catch (e) { next(e); }
});

adsRouter.get('/:id', async (req, res, next) => {
  try {
    const list = await db.listAds();
    const a = list.find((x) => x.id === req.params.id);
    if (!a) return res.status(404).json({ error: 'ad not found' });
    res.json(a);
  } catch (e) { next(e); }
});

// Soft-delete an ad — removes from ads.json (the operator-visible list) but
// leaves the PNG / sidecar JSON / reference snapshot on disk so a separate
// cleanup task could recover them later. If the deleted ad was the current
// version for its (client_id, archetype), the version-resolution logic
// naturally picks the next-newest sibling.
adsRouter.delete('/:id', async (req, res, next) => {
  try {
    let removed = null;
    await db.patchDoc('ads', (list) => {
      const arr = Array.isArray(list) ? list : [];
      const i = arr.findIndex((a) => a.id === req.params.id);
      if (i < 0) { const e = new Error('ad not found'); e.status = 404; throw e; }
      removed = arr.splice(i, 1)[0];
      return arr;
    });
    if (!removed) return res.status(404).json({ error: 'ad not found' });
    res.json({ ok: true, deleted: { id: removed.id, archetype: removed.archetype, client_id: removed.client_id } });
  } catch (e) { next(e); }
});

// Mark this ad as the "current" version for its (client_id, archetype) — the
// one shown on the client page slot card. Bumps promoted_at to NOW so the
// version-resolution logic picks it. Other versions stay in history (you can
// flip back at any time from the modal).
adsRouter.post('/:id/promote', async (req, res, next) => {
  try {
    let promoted = null;
    await db.patchDoc('ads', (list) => {
      const arr = Array.isArray(list) ? list : [];
      const i = arr.findIndex((a) => a.id === req.params.id);
      if (i < 0) { const e = new Error('ad not found'); e.status = 404; throw e; }
      arr[i] = { ...arr[i], promoted_at: new Date().toISOString() };
      promoted = arr[i];
      // Also re-prepend so the FS backend's natural ordering keeps current at index 0.
      arr.splice(i, 1);
      arr.unshift(promoted);
      return arr;
    });
    if (!promoted) return res.status(404).json({ error: 'ad not found' });
    res.json({ ok: true, ad: promoted });
  } catch (e) { next(e); }
});
