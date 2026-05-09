import { Router } from 'express';
import { promises as fs } from 'node:fs';
import { join, basename } from 'node:path';
import { DOCS_DIR, DATA_DIR } from '../lib/paths.js';
import { storage } from '../lib/storage.js';
import { readJSON } from '../lib/store.js';
import { upload, extForMime } from '../lib/uploads.js';

export const goldsRouter = Router();

// Find a gold-output image for an archetype code by listing storage prefix.
async function findOutputImage(code) {
  const keys = await storage.list('gold-output').catch(() => []);
  const re = new RegExp(`^gold-output/${code}\\.(png|jpe?g|webp)$`, 'i');
  const match = keys.find((k) => re.test(basename(k) ? `gold-output/${basename(k)}` : k));
  if (!match) return null;
  return match.startsWith('http') ? match : '/assets/' + match;
}

goldsRouter.get('/', async (_req, res, next) => {
  try {
    const dir = join(DOCS_DIR, '05_GOLD_STANDARDS');
    const out = {};
    let entries = [];
    try { entries = await fs.readdir(dir); } catch { entries = []; }
    for (const f of entries) {
      if (!f.endsWith('.json')) continue;
      const m = f.match(/^(A\d+)_/);
      if (!m) continue;
      try { out[m[1]] = await readJSON(join(dir, f)); } catch { /* skip */ }
    }
    if (Object.keys(out).length === 0) {
      try {
        const cached = await readJSON(join(DATA_DIR, '_cache', 'golds.json'));
        for (const code of Object.keys(cached)) {
          const url = await findOutputImage(code);
          if (url) cached[code] = { ...cached[code], output_image_url: url };
        }
        return res.json(cached);
      } catch { /* fall through */ }
    }
    for (const code of Object.keys(out)) {
      const url = await findOutputImage(code);
      if (url) out[code] = { ...out[code], output_image_url: url };
    }
    res.json(out);
  } catch (e) { next(e); }
});

goldsRouter.post('/:code/output-image', upload.single('image'), async (req, res, next) => {
  try {
    const { code } = req.params;
    if (!/^A\d+$/.test(code)) return res.status(400).json({ error: 'invalid archetype code' });
    if (!req.file) return res.status(400).json({ error: 'no image uploaded' });

    // Best-effort delete prior versions (different extensions).
    for (const ext of ['png', 'jpg', 'jpeg', 'webp']) {
      await storage.delete(`gold-output/${code}.${ext}`).catch(() => {});
    }

    const ext = extForMime(req.file.mimetype);
    const key = `gold-output/${code}.${ext}`;
    const { url } = await storage.put(key, req.file.buffer, req.file.mimetype);
    res.status(201).json({ ok: true, filename: `${code}.${ext}`, url });
  } catch (e) { next(e); }
});

goldsRouter.delete('/:code/output-image', async (req, res, next) => {
  try {
    const { code } = req.params;
    if (!/^A\d+$/.test(code)) return res.status(400).json({ error: 'invalid archetype code' });
    for (const ext of ['png', 'jpg', 'jpeg', 'webp']) {
      await storage.delete(`gold-output/${code}.${ext}`).catch(() => {});
    }
    res.json({ ok: true });
  } catch (e) { next(e); }
});
