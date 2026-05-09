import { Router } from 'express';
import { db } from '../lib/db.js';
import { storage } from '../lib/storage.js';
import { slugForCode } from '../lib/archetypeSlug.js';
import { ArchetypePatchSchema, validate } from '../lib/schemas.js';
import { upload, extForMime } from '../lib/uploads.js';

export const archetypeRouter = Router();

archetypeRouter.get('/', async (_req, res, next) => {
  try { res.json(await db.readDoc('archetypes')); } catch (e) { next(e); }
});

archetypeRouter.get('/:code', async (req, res, next) => {
  try {
    const list = await db.readDoc('archetypes');
    const a = (list || []).find((x) => x.code === req.params.code);
    if (!a) return res.status(404).json({ error: 'archetype not found' });
    res.json(a);
  } catch (e) { next(e); }
});

archetypeRouter.patch('/:code', async (req, res, next) => {
  try {
    const patch = validate(ArchetypePatchSchema, req.body);
    let result;
    await db.patchDoc('archetypes', (list) => {
      const arr = Array.isArray(list) ? list : [];
      const i = arr.findIndex((x) => x.code === req.params.code);
      if (i === -1) { const e = new Error('archetype not found'); e.status = 404; throw e; }
      arr[i] = { ...arr[i], ...patch };
      result = arr[i];
      return arr;
    });
    res.json(result);
  } catch (e) { next(e); }
});

archetypeRouter.post('/:code/reference', upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'no image uploaded' });
    const slug = slugForCode(req.params.code);
    if (!slug) return res.status(404).json({ error: 'unknown archetype code' });
    const ext = extForMime(req.file.mimetype);
    // Always save canonical filename so the lookup remains stable.
    const key = `reference-ads/${slug}/reference.${ext === 'png' ? 'png' : ext}`;
    const ct = req.file.mimetype || 'image/png';
    const { url } = await storage.put(key, req.file.buffer, ct);
    res.json({ ok: true, url: url + (url.includes('?') ? '&' : '?') + 't=' + Date.now() });
  } catch (e) { next(e); }
});
