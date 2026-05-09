import { Router } from 'express';
import { promises as fs } from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { FILES } from '../lib/paths.js';
import { readText, writeText, readJSON } from '../lib/store.js';

export const masterPromptRouter = Router();

const MAX_BACKUPS = 5;

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
  return [
    SECTION_RULE,
    SECTION_HEADER,
    SECTION_RULE,
    '',
    blocks.join('\n\n'),
    '',
  ].join('\n');
}

function spliceArchetypeSection(promptText, newBlock) {
  // Find the start: the line "ARCHETYPE PATTERNS — quick reference..."
  const startIdx = promptText.indexOf(SECTION_HEADER);
  if (startIdx === -1) {
    throw new Error(`Could not locate "${SECTION_HEADER}" in master prompt`);
  }
  // Walk back to the preceding rule line ("====...")
  const beforeStart = promptText.lastIndexOf(SECTION_RULE, startIdx);
  if (beforeStart === -1) {
    throw new Error('Could not locate the rule line before ARCHETYPE PATTERNS section');
  }
  // Find the end: the NEXT "====" rule line AFTER the start, then the line after that, then the "====" line CLOSING the next section header.
  // Pattern in the file is: rule \n header \n rule \n ...content... \n rule \n nextHeader \n rule
  // So we want to keep everything up to (not including) `beforeStart`, replace through the next rule line that starts the FOLLOWING section.
  const afterHeader = startIdx + SECTION_HEADER.length;
  const closingRule = promptText.indexOf(SECTION_RULE, afterHeader); // closing rule of THIS header
  if (closingRule === -1) throw new Error('Could not find closing rule of ARCHETYPE PATTERNS header');
  const nextSectionRule = promptText.indexOf(SECTION_RULE, closingRule + SECTION_RULE.length);
  if (nextSectionRule === -1) throw new Error('Could not find next section rule line');
  const before = promptText.slice(0, beforeStart);
  const after = promptText.slice(nextSectionRule);
  // Trim trailing newlines on `before` and ensure exactly two newlines between.
  return before.replace(/\n*$/, '\n\n') + newBlock.replace(/\n+$/, '') + '\n\n' + after.replace(/^\n+/, '');
}

async function rotateBackups() {
  const dir = dirname(FILES.masterPrompt);
  const base = basename(FILES.masterPrompt);
  const entries = await fs.readdir(dir);
  const backups = entries
    .filter((f) => f.startsWith(`${base}.backup-`))
    .sort(); // ISO-ish timestamps sort lexicographically
  while (backups.length > MAX_BACKUPS) {
    const drop = backups.shift();
    await fs.unlink(join(dir, drop)).catch(() => {});
  }
}

masterPromptRouter.get('/', async (_req, res, next) => {
  try {
    const txt = await readText(FILES.masterPrompt, '');
    res.type('text/markdown').send(txt);
  } catch (e) { next(e); }
});

// Accept either text/* or application/json with { content: "..." } so the UI
// can use a plain fetch() with whatever content-type is convenient.
masterPromptRouter.put('/', async (req, res, next) => {
  try {
    let body;
    if (typeof req.body === 'string') body = req.body;
    else if (req.body && typeof req.body.content === 'string') body = req.body.content;
    else return res.status(400).json({ error: 'expected text body or {content: string}' });

    if (body.length > 200_000) {
      return res.status(413).json({ error: 'master prompt too large (>200KB)' });
    }

    // Backup existing file first.
    const existing = await readText(FILES.masterPrompt, null);
    if (existing != null) {
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      const backup = `${FILES.masterPrompt}.backup-${ts}`;
      await fs.writeFile(backup, existing, 'utf8');
      await rotateBackups();
    }

    await writeText(FILES.masterPrompt, body);
    res.json({ ok: true, length: body.length });
  } catch (e) { next(e); }
});

// Preview a regenerated master prompt with the ARCHETYPE PATTERNS section
// rebuilt from data/archetypes.json. Does NOT save — returns the new full text
// so the UI can load it into the editor for review before the user saves.
masterPromptRouter.post('/preview-archetype-sync', async (_req, res, next) => {
  try {
    const promptText = await readText(FILES.masterPrompt, '');
    if (!promptText) return res.status(404).json({ error: 'master prompt is empty' });
    const archetypes = await readJSON(FILES.archetypes, []);
    if (!Array.isArray(archetypes) || archetypes.length === 0) {
      return res.status(400).json({ error: 'archetypes.json is empty or invalid' });
    }
    const newBlock = composeArchetypePatternsBlock(archetypes);
    const updated = spliceArchetypeSection(promptText, newBlock);
    res.json({ ok: true, content: updated, length: updated.length });
  } catch (e) {
    if (e.message && e.message.includes('locate')) {
      return res.status(422).json({ error: e.message });
    }
    next(e);
  }
});
