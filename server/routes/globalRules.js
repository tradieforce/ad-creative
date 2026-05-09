import { Router } from 'express';
import { FILES } from '../lib/paths.js';
import { readJSON, patchJSON } from '../lib/store.js';
import { GlobalRuleCreateSchema, GlobalRulePatchSchema, validate } from '../lib/schemas.js';

export const globalRulesRouter = Router();

function nextId(list) {
  // Generate HRnn one above the current max numeric suffix.
  let max = 0;
  for (const r of list) {
    const m = String(r.id || '').match(/HR(\d+)/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return 'HR' + String(max + 1).padStart(2, '0');
}

globalRulesRouter.get('/', async (_req, res, next) => {
  try {
    res.json(await readJSON(FILES.globalRules, []));
  } catch (e) { next(e); }
});

globalRulesRouter.post('/', async (req, res, next) => {
  try {
    const data = validate(GlobalRuleCreateSchema, req.body);
    const updated = await patchJSON(FILES.globalRules, (list) => {
      const id = data.id || nextId(list);
      if (list.some((r) => r.id === id)) {
        const e = new Error('rule id already exists');
        e.status = 409;
        throw e;
      }
      list.push({ id, rule: data.rule });
      return list;
    });
    res.status(201).json(updated[updated.length - 1]);
  } catch (e) { next(e); }
});

globalRulesRouter.patch('/:id', async (req, res, next) => {
  try {
    const data = validate(GlobalRulePatchSchema, req.body);
    const updated = await patchJSON(FILES.globalRules, (list) => {
      const i = list.findIndex((r) => r.id === req.params.id);
      if (i === -1) {
        const e = new Error('rule not found');
        e.status = 404;
        throw e;
      }
      list[i] = { ...list[i], rule: data.rule };
      return list;
    });
    res.json(updated.find((r) => r.id === req.params.id));
  } catch (e) { next(e); }
});

globalRulesRouter.delete('/:id', async (req, res, next) => {
  try {
    await patchJSON(FILES.globalRules, (list) => {
      const i = list.findIndex((r) => r.id === req.params.id);
      if (i === -1) {
        const e = new Error('rule not found');
        e.status = 404;
        throw e;
      }
      list.splice(i, 1);
      return list;
    });
    res.json({ ok: true });
  } catch (e) { next(e); }
});
