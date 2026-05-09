// Loads the 8+ gold-standard prompts from docs/05_GOLD_STANDARDS/ and
// substitutes the placeholders inside data/master-prompt.md with their actual
// content. The master prompt itself flags this as critical for quality:
//
//   "The 8 gold-standard examples in the system prompt are critical — they're
//    how Claude calibrates quality. Don't trim them to save tokens."
//
// Also exposes a helper to find the matching gold-output PNG for an archetype
// (assets/gold-output/A{n}.png) so we can attach it as a "quality bar" image.

import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { DOCS_DIR, ASSETS_DIR } from './paths.js';

const GS_DIR = join(DOCS_DIR, '05_GOLD_STANDARDS');
const GO_DIR = join(ASSETS_DIR, 'gold-output');

let cache = null;

async function loadAll() {
  const files = (await fs.readdir(GS_DIR)).filter((f) => f.endsWith('.json'));
  const out = new Map();   // filename (without .json) → full_prompt_used string
  for (const f of files) {
    try {
      const j = JSON.parse(await fs.readFile(join(GS_DIR, f), 'utf8'));
      const text = (j.full_prompt_used || '').trim();
      if (text) out.set(f.replace(/\.json$/, ''), text);
    } catch { /* skip malformed */ }
  }
  return out;
}

async function ensure() {
  if (!cache) cache = await loadAll();
  return cache;
}

// Substitute every [Insert full prompt from gold_standards/{name}.json ...]
// in the system prompt with the matching gold standard text. Empty / missing
// gold standards are replaced with a clearly-marked omission.
export async function inlineGoldStandards(systemPrompt) {
  const gs = await ensure();
  return systemPrompt.replace(
    /\[Insert full prompt from gold_standards\/([A-Za-z0-9_-]+)\.json[^\]]*\]/g,
    (_, name) => {
      const text = gs.get(name);
      if (text) return text;
      return `[(no gold standard recorded for ${name} yet — Claude proceeds without this calibration example)]`;
    }
  );
}

// Returns the disk path to the approved gold-output PNG for a given archetype
// code (e.g. 'A1' → assets/gold-output/A1.png) or null if not present.
export async function goldOutputImagePath(archetypeCode) {
  const path = join(GO_DIR, `${archetypeCode}.png`);
  try { await fs.access(path); return path; } catch { return null; }
}

// Reset cache (call from a /api/golds upload route in future).
export function resetGoldStandardsCache() { cache = null; }
