import { Router } from 'express';
import { z } from 'zod';
import { db } from '../lib/db.js';
import { PricePatchSchema, validate } from '../lib/schemas.js';

export const pricesRouter = Router();

const PriceCreateSchema = z.object({
  city: z.string().min(1).max(120),
  fixed: z.string().max(40).optional().default(''),
  anchor: z.string().max(40).optional().default(''),
  perWeek: z.string().max(40).optional().default(''),
  rebate: z.string().max(40).optional().default(''),
}).strict();

pricesRouter.get('/', async (_req, res, next) => {
  try { res.json(await db.readDoc('prices')); } catch (e) { next(e); }
});

pricesRouter.post('/', async (req, res, next) => {
  try {
    const data = validate(PriceCreateSchema, req.body);
    let created;
    await db.patchDoc('prices', (list) => {
      const arr = Array.isArray(list) ? list : [];
      if (arr.some((p) => p.city === data.city)) {
        const e = new Error('city already exists'); e.status = 409; throw e;
      }
      created = data;
      arr.push(created);
      return arr;
    });
    res.status(201).json(created);
  } catch (e) { next(e); }
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

pricesRouter.delete('/:city', async (req, res, next) => {
  try {
    let removed = null;
    await db.patchDoc('prices', (list) => {
      const arr = Array.isArray(list) ? list : [];
      const i = arr.findIndex((p) => p.city === req.params.city);
      if (i === -1) { const e = new Error('city not found'); e.status = 404; throw e; }
      removed = arr.splice(i, 1)[0];
      return arr;
    });
    res.json({ ok: true, removed });
  } catch (e) { next(e); }
});
