import { Router } from 'express';
import { promises as fs } from 'node:fs';
import { join, basename } from 'node:path';
import { FILES, ASSETS_DIR } from '../lib/paths.js';
import { readJSON, writeJSON, patchJSON } from '../lib/store.js';
import { ClientCreateSchema, ClientPatchSchema, validate } from '../lib/schemas.js';
import { upload, extForMime } from '../lib/uploads.js';
import { slugify } from '../lib/slugify.js';

export const clientsRouter = Router();

const PHOTO_TYPES = new Set(['team', 'owner', 'van', 'reaction', 'bill-holder']);

// Mirrors the primary service area's name + postcode onto the top-level city + postcode
// fields so master-prompt {{city}} references keep working transparently.
function syncCityFromPrimary(record) {
  const areas = Array.isArray(record.service_areas) ? record.service_areas : [];
  if (areas.length === 0) return record;
  const primary = areas.find((a) => a.primary) || areas[0];
  return {
    ...record,
    city: primary.name || record.city || '',
    postcode: primary.postcode || record.postcode || '',
  };
}

async function listClientFiles() {
  try {
    const entries = await fs.readdir(FILES.clientsDir);
    return entries.filter((f) => f.endsWith('.json'));
  } catch (e) {
    if (e.code === 'ENOENT') return [];
    throw e;
  }
}

async function loadAll() {
  const files = await listClientFiles();
  const out = [];
  for (const f of files) {
    try { out.push(await readJSON(join(FILES.clientsDir, f))); } catch { /* skip */ }
  }
  return out;
}

clientsRouter.get('/', async (_req, res, next) => {
  try { res.json(await loadAll()); } catch (e) { next(e); }
});

clientsRouter.get('/:id', async (req, res, next) => {
  try {
    const path = join(FILES.clientsDir, `${req.params.id}.json`);
    const c = await readJSON(path);
    res.json(c);
  } catch (e) {
    if (e.code === 'ENOENT') return res.status(404).json({ error: 'client not found' });
    next(e);
  }
});

clientsRouter.post('/', async (req, res, next) => {
  try {
    const data = validate(ClientCreateSchema, req.body);
    const id = data.id ? slugify(data.id) : slugify(data.business_name);
    if (!id) return res.status(400).json({ error: 'could not derive client id' });

    const path = join(FILES.clientsDir, `${id}.json`);
    try {
      await fs.access(path);
      return res.status(409).json({ error: 'client id already exists' });
    } catch { /* fine, doesn't exist */ }

    const baseRecord = {
      id,
      ...data,
      onboarded_date: data.onboarded_date || new Date().toISOString().slice(0, 10),
      ads_generated: [],
    };
    const record = syncCityFromPrimary(baseRecord);
    await writeJSON(path, record);
    await fs.mkdir(join(ASSETS_DIR, 'client-uploads', id), { recursive: true });
    res.status(201).json(record);
  } catch (e) { next(e); }
});

clientsRouter.patch('/:id', async (req, res, next) => {
  try {
    const patch = validate(ClientPatchSchema, req.body);
    const path = join(FILES.clientsDir, `${req.params.id}.json`);
    const updated = await patchJSON(path, (current) => syncCityFromPrimary({ ...current, ...patch }));
    res.json(updated);
  } catch (e) {
    if (e.code === 'ENOENT') return res.status(404).json({ error: 'client not found' });
    next(e);
  }
});

clientsRouter.delete('/:id', async (req, res, next) => {
  try {
    const path = join(FILES.clientsDir, `${req.params.id}.json`);
    await fs.unlink(path);
    // Remove uploads directory (best-effort).
    const uploads = join(ASSETS_DIR, 'client-uploads', req.params.id);
    await fs.rm(uploads, { recursive: true, force: true }).catch(() => {});
    res.json({ ok: true });
  } catch (e) {
    if (e.code === 'ENOENT') return res.status(404).json({ error: 'client not found' });
    next(e);
  }
});

// Photo upload: POST /api/clients/:id/photo/:type (multipart with `image`).
// Saves to assets/client-uploads/{id}/{type}-{n}.{ext} where n is the next
// available sequence number.
clientsRouter.post('/:id/photo/:type', upload.single('image'), async (req, res, next) => {
  try {
    const { id, type } = req.params;
    if (!PHOTO_TYPES.has(type)) return res.status(400).json({ error: 'unknown photo type' });
    if (!req.file) return res.status(400).json({ error: 'no image uploaded' });

    const clientPath = join(FILES.clientsDir, `${id}.json`);
    try { await fs.access(clientPath); }
    catch { return res.status(404).json({ error: 'client not found' }); }

    const dir = join(ASSETS_DIR, 'client-uploads', id);
    await fs.mkdir(dir, { recursive: true });

    const existing = await fs.readdir(dir).catch(() => []);
    let next = 1;
    for (const f of existing) {
      const m = f.match(new RegExp(`^${type}-(\\d+)\\.`));
      if (m) next = Math.max(next, parseInt(m[1], 10) + 1);
    }
    const ext = extForMime(req.file.mimetype);
    const filename = `${type}-${next}.${ext}`;
    await fs.writeFile(join(dir, filename), req.file.buffer);

    // Flip the corresponding `{type}_photos_uploaded` flag on the client record.
    const flagKey = `${type.replace('-', '_')}_photos_uploaded`;
    await patchJSON(clientPath, (c) => ({ ...c, [flagKey]: true }));

    res.status(201).json({
      ok: true,
      filename,
      url: `/assets/client-uploads/${id}/${filename}`,
    });
  } catch (e) { next(e); }
});

clientsRouter.get('/:id/photos', async (req, res, next) => {
  try {
    const dir = join(ASSETS_DIR, 'client-uploads', req.params.id);
    const files = await fs.readdir(dir).catch(() => []);
    res.json(files.map((f) => ({
      filename: f,
      url: `/assets/client-uploads/${req.params.id}/${f}`,
    })));
  } catch (e) { next(e); }
});

clientsRouter.delete('/:id/photo/:filename', async (req, res, next) => {
  try {
    // Sanity check: don't allow path traversal.
    const safe = basename(req.params.filename);
    if (safe !== req.params.filename) return res.status(400).json({ error: 'bad filename' });
    const path = join(ASSETS_DIR, 'client-uploads', req.params.id, safe);
    await fs.unlink(path).catch(() => {});
    res.json({ ok: true });
  } catch (e) { next(e); }
});
