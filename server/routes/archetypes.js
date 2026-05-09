import { Router } from 'express';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { FILES, ASSETS_DIR } from '../lib/paths.js';
import { readJSON, patchJSON } from '../lib/store.js';
import { slugForCode } from '../lib/archetypeSlug.js';
import { ArchetypePatchSchema, validate } from '../lib/schemas.js';
import { upload, extForMime } from '../lib/uploads.js';

export const archetypeRouter = Router();

archetypeRouter.get('/', async (_req, res, next) => {
  try {
    res.json(await readJSON(FILES.archetypes, []));
  } catch (e) { next(e); }
});

archetypeRouter.get('/:code', async (req, res, next) => {
  try {
    const list = await readJSON(FILES.archetypes, []);
    const a = list.find((x) => x.code === req.params.code);
    if (!a) return res.status(404).json({ error: 'archetype not found' });
    res.json(a);
  } catch (e) { next(e); }
});

archetypeRouter.patch('/:code', async (req, res, next) => {
  try {
    const patch = validate(ArchetypePatchSchema, req.body);
    const updated = await patchJSON(FILES.archetypes, (list) => {
      const i = list.findIndex((x) => x.code === req.params.code);
      if (i === -1) {
        const e = new Error('archetype not found');
        e.status = 404;
        throw e;
      }
      list[i] = { ...list[i], ...patch };
      return list;
    });
    const a = updated.find((x) => x.code === req.params.code);
    res.json(a);
  } catch (e) { next(e); }
});

// Reference ad upload: writes to assets/reference-ads/{slug}/reference.{ext}
// and (since handoff convention is canonical reference.png) we always save as
// reference.png regardless of source extension. Express static serves it
// straight from disk; no path written into archetypes.json.
archetypeRouter.post('/:code/reference', upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'no image uploaded' });
    const slug = slugForCode(req.params.code);
    if (!slug) return res.status(404).json({ error: 'unknown archetype code' });
    const dir = join(ASSETS_DIR, 'reference-ads', slug);
    await fs.mkdir(dir, { recursive: true });
    const path = join(dir, 'reference.png');
    await fs.writeFile(path, req.file.buffer);
    res.json({
      ok: true,
      url: `/assets/reference-ads/${slug}/reference.png?t=${Date.now()}`,
    });
  } catch (e) { next(e); }
});
