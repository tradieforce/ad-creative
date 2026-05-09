import { Router } from 'express';
import { db } from '../lib/db.js';
import { PricePatchSchema, validate } from '../lib/schemas.js';

export const pricesRouter = Router();

pricesRouter.get('/', async (_req, res, next) => {
  try { res.json(await db.readDoc('prices')); } catch (e) { next(e); }
});

pricesRouter.patch('/:city', async (req, res, next) => {
  try {
    const patch = validate(PricePatchSchema, req.body);
    let updated;
    await db.patchDoc('prices', (list) => {
      const arr = Array.isArray(list) ? list : [];
      const i = arr.findIndex((p) => p.city === req.params.city);
      if (i === -1) { const e = new Error('city not found'); e.status = 404; throw e; }
      arr[i] = { ...arr[i], ...patch };
      updated = arr[i];
      return arr;
    });
    res.json(updated);
  } catch (e) { next(e); }
});
