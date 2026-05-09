import { Router } from 'express';
import { FILES } from '../lib/paths.js';
import { readJSON, patchJSON } from '../lib/store.js';
import { PricePatchSchema, validate } from '../lib/schemas.js';

export const pricesRouter = Router();

pricesRouter.get('/', async (_req, res, next) => {
  try { res.json(await readJSON(FILES.prices, [])); } catch (e) { next(e); }
});

pricesRouter.patch('/:city', async (req, res, next) => {
  try {
    const patch = validate(PricePatchSchema, req.body);
    const updated = await patchJSON(FILES.prices, (list) => {
      const i = list.findIndex((p) => p.city === req.params.city);
      if (i === -1) {
        const e = new Error('city not found');
        e.status = 404;
        throw e;
      }
      list[i] = { ...list[i], ...patch };
      return list;
    });
    res.json(updated.find((p) => p.city === req.params.city));
  } catch (e) { next(e); }
});
