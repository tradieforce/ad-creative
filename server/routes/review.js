// Review queue — generated ads land in `pending` state, operator approves or
// rejects from the UI. Approved ads can be exported / delivered to clients.
//
// State is stored on the ad record itself (data.review_status: pending|approved|rejected)
// rather than a separate table — keeps the model simple.

import { Router } from 'express';
import { z } from 'zod';
import { db } from '../lib/db.js';
import { validate } from '../lib/schemas.js';

export const reviewRouter = Router();

const StatusUpdateSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']),
  notes: z.string().max(2000).optional().default(''),
}).strict();

// List ads filtered by review_status (default: pending).
reviewRouter.get('/', async (req, res, next) => {
  try {
    const wanted = req.query.status || 'pending';
    const ads = await db.listAds();
    const filtered = ads.filter((a) => (a.review_status || 'pending') === wanted);
    res.json(filtered);
  } catch (e) { next(e); }
});

// Update review status (and optional notes).
reviewRouter.post('/:adId', async (req, res, next) => {
  try {
    const body = validate(StatusUpdateSchema, req.body);
    let updated;
    await db.patchAd(req.params.adId, (current) => {
      if (!current) throw Object.assign(new Error('ad not found'), { status: 404 });
      updated = {
        ...current,
        review_status: body.status,
        review_notes: body.notes || current.review_notes || '',
        reviewed_at: new Date().toISOString(),
      };
      return updated;
    });
    if (!updated) return res.status(404).json({ error: 'ad not found' });
    res.json(updated);
  } catch (e) { next(e); }
});
