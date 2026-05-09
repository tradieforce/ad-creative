import { Router } from 'express';
import { db } from '../lib/db.js';

export const masterPromptRouter = Router();

const SECTION_HEADER = 'ARCHETYPE PATTERNS — quick reference for the 10 archetypes';
const SECTION_RULE = '================================================================';

function composeArchetypePatternsBlock(archetypes) {
  const blocks = archetypes
    .slice()
    .sort((a, b) => {
      const an = parseInt(String(a.code || '').replace(/\D/g, ''), 10) || 999;
      const bn = parseInt(String(b.code || '').replace(/\D/g, ''), 10) || 999;
      return an - bn;
    })
    .map((a) => {
      const code = a.code || '?';
      const name = (a.name || '').toUpperCase();
      const tag = a.funnel_stage ? ` (${a.funnel_stage})` : '';
      const lines = [`${code} ${name}${tag}`];
      if (a.fires) lines.push(`- Fires: ${a.fires}`);
      for (const r of (a.rules || [])) lines.push(`- ${r}`);
      return lines.join('\n');
    });
  return [SECTION_RULE, SECTION_HEADER, SECTION_RULE, '', blocks.join('\n\n'), ''].join('\n');
}

function spliceArchetypeSection(promptText, newBlock) {
  const startIdx = promptText.indexOf(SECTION_HEADER);
  if (startIdx === -1) throw new Error(`Could not locate "${SECTION_HEADER}" in master prompt`);
  const beforeStart = promptText.lastIndexOf(SECTION_RULE, startIdx);
  if (beforeStart === -1) throw new Error('Could not locate the rule line before ARCHETYPE PATTERNS section');
  const afterHeader = startIdx + SECTION_HEADER.length;
  const closingRule = promptText.indexOf(SECTION_RULE, afterHeader);
  if (closingRule === -1) throw new Error('Could not find closing rule of ARCHETYPE PATTERNS header');
  const nextSectionRule = promptText.indexOf(SECTION_RULE, closingRule + SECTION_RULE.length);
  if (nextSectionRule === -1) throw new Error('Could not find next section rule line');
  const before = promptText.slice(0, beforeStart);
  const after = promptText.slice(nextSectionRule);
  return before.replace(/\n*$/, '\n\n') + newBlock.replace(/\n+$/, '') + '\n\n' + after.replace(/^\n+/, '');
}

masterPromptRouter.get('/', async (_req, res, next) => {
  try {
    const txt = await db.readDoc('master-prompt');
    res.type('text/markdown').send(txt || '');
  } catch (e) { next(e); }
});

masterPromptRouter.put('/', async (req, res, next) => {
  try {
    let body;
    if (typeof req.body === 'string') body = req.body;
    else if (req.body && typeof req.body.content === 'string') body = req.body.content;
    else return res.status(400).json({ error: 'expected text body or {content: string}' });

    if (body.length > 200_000) return res.status(413).json({ error: 'master prompt too large (>200KB)' });

    // Optional: keep a backup as a separate doc key (kept simple — last 1 only).
    try {
      const prev = await db.readDoc('master-prompt');
      if (prev) await db.writeDoc('master-prompt-backup', prev);
    } catch { /* ignore backup failures */ }

    await db.writeDoc('master-prompt', body);
    res.json({ ok: true, length: body.length });
  } catch (e) { next(e); }
});

masterPromptRouter.post('/preview-archetype-sync', async (_req, res, next) => {
  try {
    const promptText = await db.readDoc('master-prompt');
    if (!promptText) return res.status(404).json({ error: 'master prompt is empty' });
    const archetypes = await db.readDoc('archetypes');
    if (!Array.isArray(archetypes) || archetypes.length === 0) {
      return res.status(400).json({ error: 'archetypes is empty or invalid' });
    }
    const newBlock = composeArchetypePatternsBlock(archetypes);
    const updated = spliceArchetypeSection(promptText, newBlock);
    res.json({ ok: true, content: updated, length: updated.length });
  } catch (e) {
    if (e.message && e.message.includes('locate')) return res.status(422).json({ error: e.message });
    next(e);
  }
});
