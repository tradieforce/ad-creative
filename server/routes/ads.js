import { Router } from 'express';
import { db } from '../lib/db.js';

export const adsRouter = Router();

adsRouter.get('/', async (_req, res, next) => {
  try { res.json(await db.listAds()); } catch (e) { next(e); }
});

adsRouter.get('/:id', async (req, res, next) => {
  try {
    const list = await db.listAds();
    const a = list.find((x) => x.id === req.params.id);
    if (!a) return res.status(404).json({ error: 'ad not found' });
    res.json(a);
  } catch (e) { next(e); }
});
