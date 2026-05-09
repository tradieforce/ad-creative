import { Router } from 'express';
import { db } from '../lib/db.js';
import { GlobalRuleCreateSchema, GlobalRulePatchSchema, validate } from '../lib/schemas.js';

export const globalRulesRouter = Router();

function nextId(list) {
  let max = 0;
  for (const r of list) {
    const m = String(r.id || '').match(/HR(\d+)/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return 'HR' + String(max + 1).padStart(2, '0');
}

globalRulesRouter.get('/', async (_req, res, next) => {
  try { res.json(await db.readDoc('global-rules')); } catch (e) { next(e); }
});

globalRulesRouter.post('/', async (req, res, next) => {
  try {
    const data = validate(GlobalRuleCreateSchema, req.body);
    let created;
    await db.patchDoc('global-rules', (list) => {
      const arr = Array.isArray(list) ? list : [];
      const id = data.id || nextId(arr);
      if (arr.some((r) => r.id === id)) {
        const e = new Error('rule id already exists'); e.status = 409; throw e;
      }
      created = { id, rule: data.rule };
      arr.push(created);
      return arr;
    });
    res.status(201).json(created);
  } catch (e) { next(e); }
});

globalRulesRouter.patch('/:id', async (req, res, next) => {
  try {
    const data = validate(GlobalRulePatchSchema, req.body);
    let updated;
    await db.patchDoc('global-rules', (list) => {
      const arr = Array.isArray(list) ? list : [];
      const i = arr.findIndex((r) => r.id === req.params.id);
      if (i === -1) { const e = new Error('rule not found'); e.status = 404; throw e; }
      arr[i] = { ...arr[i], rule: data.rule };
      updated = arr[i];
      return arr;
    });
    res.json(updated);
  } catch (e) { next(e); }
});

globalRulesRouter.delete('/:id', async (req, res, next) => {
  try {
    await db.patchDoc('global-rules', (list) => {
      const arr = Array.isArray(list) ? list : [];
      const i = arr.findIndex((r) => r.id === req.params.id);
      if (i === -1) { const e = new Error('rule not found'); e.status = 404; throw e; }
      arr.splice(i, 1);
      return arr;
    });
    res.json({ ok: true });
  } catch (e) { next(e); }
});
