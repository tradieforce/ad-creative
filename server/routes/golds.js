import { Router } from 'express';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { DOCS_DIR, DATA_DIR, ASSETS_DIR } from '../lib/paths.js';
import { readJSON } from '../lib/store.js';
import { upload, extForMime } from '../lib/uploads.js';

export const goldsRouter = Router();

const GOLD_OUTPUT_DIR = join(ASSETS_DIR, 'gold-output');

// Look up an uploaded output image for an archetype code by checking
// assets/gold-output/<code>.{png,jpg,jpeg,webp}. Returns the public URL or null.
async function findOutputImage(code) {
  try {
    const entries = await fs.readdir(GOLD_OUTPUT_DIR);
    const match = entries.find((f) => f.match(new RegExp(`^${code}\\.(png|jpe?g|webp)$`, 'i')));
    if (match) return `/assets/gold-output/${match}`;
  } catch { /* dir may not exist yet */ }
  return null;
}

// Read-only. Source of truth is docs/05_GOLD_STANDARDS/*.json — one file per
// archetype. Returns an object keyed by archetype code (A1, A2, ...). Falls
// back to the cached extract written during migration if the source dir is
// missing.
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
      try {
        out[m[1]] = await readJSON(join(dir, f));
      } catch { /* skip */ }
    }
    if (Object.keys(out).length === 0) {
      // Fall back to extract cache if docs dir was scrubbed.
      try {
        const cached = await readJSON(join(DATA_DIR, '_cache', 'golds.json'));
        // Still annotate cached entries with any uploaded output_image_url
        for (const code of Object.keys(cached)) {
          const url = await findOutputImage(code);
          if (url) cached[code] = { ...cached[code], output_image_url: url };
        }
        return res.json(cached);
      } catch { /* fall through to empty */ }
    }
    // Annotate each entry with any uploaded output_image_url found on disk.
    for (const code of Object.keys(out)) {
      const url = await findOutputImage(code);
      if (url) out[code] = { ...out[code], output_image_url: url };
    }
    res.json(out);
  } catch (e) { next(e); }
});

// Upload (or replace) the gold-standard output image for an archetype code.
// Stored at assets/gold-output/<code>.<ext>. Code must match /^A\d+$/.
goldsRouter.post('/:code/output-image', upload.single('image'), async (req, res, next) => {
  try {
    const { code } = req.params;
    if (!/^A\d+$/.test(code)) return res.status(400).json({ error: 'invalid archetype code' });
    if (!req.file) return res.status(400).json({ error: 'no image uploaded' });

    await fs.mkdir(GOLD_OUTPUT_DIR, { recursive: true });

    // Remove any prior file for this code so we don't keep stale extensions.
    try {
      const existing = await fs.readdir(GOLD_OUTPUT_DIR);
      for (const f of existing) {
        if (f.match(new RegExp(`^${code}\\.(png|jpe?g|webp)$`, 'i'))) {
          await fs.unlink(join(GOLD_OUTPUT_DIR, f)).catch(() => {});
        }
      }
    } catch { /* dir may have just been created */ }

    const ext = extForMime(req.file.mimetype);
    const filename = `${code}.${ext}`;
    await fs.writeFile(join(GOLD_OUTPUT_DIR, filename), req.file.buffer);

    res.status(201).json({
      ok: true,
      filename,
      url: `/assets/gold-output/${filename}`,
    });
  } catch (e) { next(e); }
});

// Delete the uploaded output image for an archetype.
goldsRouter.delete('/:code/output-image', async (req, res, next) => {
  try {
    const { code } = req.params;
    if (!/^A\d+$/.test(code)) return res.status(400).json({ error: 'invalid archetype code' });
    try {
      const entries = await fs.readdir(GOLD_OUTPUT_DIR);
      for (const f of entries) {
        if (f.match(new RegExp(`^${code}\\.(png|jpe?g|webp)$`, 'i'))) {
          await fs.unlink(join(GOLD_OUTPUT_DIR, f));
        }
      }
    } catch { /* dir may not exist */ }
    res.json({ ok: true });
  } catch (e) { next(e); }
});
