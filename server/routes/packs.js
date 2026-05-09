// POST /api/packs — build a pack manifest for a client.
// GET  /api/packs   — list all packs.
// GET  /api/packs/:id — fetch a specific pack record + its ads.
//
// We do NOT fire generations from this route. The UI (or a future automation
// worker) loops through `manifest.entries` calling /api/generate for each.
// This keeps single function invocations bounded and makes pack progress
// observable / resumable.

import { Router } from 'express';
import { z } from 'zod';
import { db } from '../lib/db.js';
import { buildPackManifest } from '../lib/packManifest.js';
import { validate } from '../lib/schemas.js';

export const packsRouter = Router();

const PackCreateSchema = z.object({
  client_id: z.string().min(1).max(120),
  archetype_filter: z.array(z.string().max(10)).optional(),  // optional whitelist
}).strict();

// Build manifest. Saves to documents.packs.<id> so we can list/inspect later.
packsRouter.post('/', async (req, res, next) => {
  try {
    const body = validate(PackCreateSchema, req.body);
    const client = await db.readClient(body.client_id);
    const manifest = await buildPackManifest({ client, archetypeFilter: body.archetype_filter || null });
    // Persist as a document keyed by pack id.
    await db.writeDoc('pack_' + manifest.pack_id, manifest);
    res.status(201).json(manifest);
  } catch (e) {
    if (e.code === 'ENOENT') return res.status(404).json({ error: 'client not found' });
    next(e);
  }
});

packsRouter.get('/:id', async (req, res, next) => {
  try {
    const pack = await db.readDoc('pack_' + req.params.id);
    if (!pack || !pack.pack_id) return res.status(404).json({ error: 'pack not found' });
    // Augment with ads belonging to this pack.
    const ads = (await db.listAds()).filter((a) => a.pack_id === req.params.id);
    res.json({ ...pack, ads });
  } catch (e) { next(e); }
});

// (List packs is harder with our document store — defer until needed.)
