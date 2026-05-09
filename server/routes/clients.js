import { Router } from 'express';
import { basename } from 'node:path';
import { db } from '../lib/db.js';
import { storage } from '../lib/storage.js';
import { ClientCreateSchema, ClientPatchSchema, validate } from '../lib/schemas.js';
import { upload, extForMime } from '../lib/uploads.js';
import { slugify } from '../lib/slugify.js';

export const clientsRouter = Router();

const PHOTO_TYPES = new Set(['team', 'owner', 'van', 'reaction', 'bill-holder']);

function syncCityFromPrimary(record) {
  const areas = Array.isArray(record.service_areas) ? record.service_areas : [];
  if (areas.length === 0) return record;
  const primary = areas.find((a) => a.primary) || areas[0];
  return { ...record, city: primary.name || record.city || '', postcode: primary.postcode || record.postcode || '' };
}

clientsRouter.get('/', async (_req, res, next) => {
  try { res.json(await db.listClients()); } catch (e) { next(e); }
});

clientsRouter.get('/:id', async (req, res, next) => {
  try { res.json(await db.readClient(req.params.id)); }
  catch (e) {
    if (e.code === 'ENOENT') return res.status(404).json({ error: 'client not found' });
    next(e);
  }
});

clientsRouter.post('/', async (req, res, next) => {
  try {
    const data = validate(ClientCreateSchema, req.body);
    const id = data.id ? slugify(data.id) : slugify(data.business_name);
    if (!id) return res.status(400).json({ error: 'could not derive client id' });

    const existing = await db.readClient(id).catch(() => null);
    if (existing) return res.status(409).json({ error: 'client id already exists' });

    const baseRecord = { id, ...data, onboarded_date: data.onboarded_date || new Date().toISOString().slice(0, 10), ads_generated: [] };
    const record = syncCityFromPrimary(baseRecord);
    await db.writeClient(id, record);
    res.status(201).json(record);
  } catch (e) { next(e); }
});

clientsRouter.patch('/:id', async (req, res, next) => {
  try {
    const patch = validate(ClientPatchSchema, req.body);
    let updated;
    await db.patchClient(req.params.id, (current) => {
      updated = syncCityFromPrimary({ ...current, ...patch });
      return updated;
    });
    res.json(updated);
  } catch (e) {
    if (e.code === 'ENOENT') return res.status(404).json({ error: 'client not found' });
    next(e);
  }
});

clientsRouter.delete('/:id', async (req, res, next) => {
  try { await db.deleteClient(req.params.id); res.json({ ok: true }); }
  catch (e) { next(e); }
});

clientsRouter.post('/:id/photo/:type', upload.single('image'), async (req, res, next) => {
  try {
    const { id, type } = req.params;
    if (!PHOTO_TYPES.has(type)) return res.status(400).json({ error: 'unknown photo type' });
    if (!req.file) return res.status(400).json({ error: 'no image uploaded' });

    const client = await db.readClient(id).catch(() => null);
    if (!client) return res.status(404).json({ error: 'client not found' });

    // Find next sequence number by listing existing client photos.
    const existing = await storage.list(`client-uploads/${id}`).catch(() => []);
    let next = 1;
    for (const k of existing) {
      const m = basename(k).match(new RegExp(`^${type}-(\\d+)\\.`));
      if (m) next = Math.max(next, parseInt(m[1], 10) + 1);
    }
    const ext = extForMime(req.file.mimetype);
    const filename = `${type}-${next}.${ext}`;
    const key = `client-uploads/${id}/${filename}`;
    const { url } = await storage.put(key, req.file.buffer, req.file.mimetype);

    const flagKey = `${type.replace('-', '_')}_photos_uploaded`;
    await db.patchClient(id, (c) => ({ ...c, [flagKey]: true }));

    res.status(201).json({ ok: true, filename, url });
  } catch (e) { next(e); }
});

clientsRouter.get('/:id/photos', async (req, res, next) => {
  try {
    const keys = await storage.list(`client-uploads/${req.params.id}`).catch(() => []);
    res.json(keys.map((k) => ({
      filename: basename(k),
      url: k.startsWith('http') ? k : '/assets/' + k,
    })));
  } catch (e) { next(e); }
});

clientsRouter.delete('/:id/photo/:filename', async (req, res, next) => {
  try {
    const safe = basename(req.params.filename);
    if (safe !== req.params.filename) return res.status(400).json({ error: 'bad filename' });
    await storage.delete(`client-uploads/${req.params.id}/${safe}`);
    res.json({ ok: true });
  } catch (e) { next(e); }
});
