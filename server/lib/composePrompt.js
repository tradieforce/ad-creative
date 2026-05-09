// Layer 2 — Claude composes the ChatGPT image prompt.
//
// QUALITY-FIRST CONFIG (cost is no object):
//   - Inlines all gold-standard prompts into the system prompt at call time
//   - Enables extended thinking (12k thinking budget) so Opus reasons about
//     pack balance, vision findings, and rule conflicts before composing
//   - max_tokens 20000 to leave headroom after thinking
//   - Caches the (large, ~80KB) augmented system prompt across pack calls
//
// Inputs (from generate.js):
//   - systemPrompt: string  (data/master-prompt.md)
//   - userMessage:  string  (the per-ad context block)
//   - attachments:  [{ path, label }]  (reference + gold-output + components + photos)
//
// Output: { promptText, usage, costUsd, model, stopReason }

import { extname } from 'node:path';
import { inlineGoldStandards } from './goldStandards.js';
import { loadBuffer, mimeFromRef } from './storage.js';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

const PRICING = {
  'claude-opus-4-7':    { input: 15.00, cacheWrite: 18.75, cacheRead: 1.50, output: 75.00 },
  'claude-sonnet-4-6':  { input: 3.00,  cacheWrite: 3.75,  cacheRead: 0.30, output: 15.00 },
  'claude-haiku-4-5':   { input: 1.00,  cacheWrite: 1.25,  cacheRead: 0.10, output: 5.00 },
};

const MIME_BY_EXT = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.gif': 'image/gif',
};

// Quality dial — extended thinking budgets. Tunable per call from generate.js.
export const THINKING_BUDGET = 12000;
export const MAX_TOKENS = 20000;

// Operator-mandated rule priority + reference-ad-as-structural-template.
// This is appended to the system prompt on every call so it survives any
// edits to data/master-prompt.md.
export const RULE_PRIORITY_DIRECTIVE = `
═══════════════════════════════════════════════════════════════
OPERATOR-MANDATED PRIORITY ORDER (overrides anything earlier in this prompt)
═══════════════════════════════════════════════════════════════

When composing the prompt, apply rules and templates in this strict priority:

PRIORITY 1 (HIGHEST) — ARCHETYPE-SPECIFIC RULES
  The "ARCHETYPE-SPECIFIC RULES" block in the user message is the canonical,
  non-negotiable behaviour for this archetype. If anything in this prompt or
  the master prompt conflicts with an archetype-specific rule, the archetype-
  specific rule WINS. Never silently drop or weaken an archetype-specific rule
  to satisfy a global rule. Surface the conflict in your composition by
  honouring the archetype-specific rule.

PRIORITY 2 — REFERENCE AD AS THE STYLE + STRUCTURE TEMPLATE
  IMAGE 1 (the reference ad attached for this archetype) is the GOLD STANDARD
  for this archetype — both STRUCTURE and STYLE. The operator's directive is
  to mirror it as closely as possible. Only the picked variable content
  changes between generations; everything else should match the reference.

  Match the reference ad on ALL of these:
    • Layout — where headline / hero / price / CTA / badges / brand strip sit
    • Hierarchy — what dominates, what's secondary, what's footer
    • Zone geometry — split-screen vs full-bleed vs top-to-bottom
    • Relative sizing of major elements
    • PALETTE — pull the reference's specific colours (background, accent,
      headline colour, price-block colour). Do NOT invent a fresh palette.
      If the reference uses navy + magenta + cream, the generation uses
      navy + magenta + cream. Subtle tonal variation only.
    • Typography style — match the weight/family/proportions visible in
      the reference. Same hierarchy in headline + sub-headline + body.
    • Footer treatment — pill cards, trust badges, anchors — match.
    • Corner badges — match position, shape, treatment.

  What changes per generation (from the picks block):
    • Headline / sub-headline / value-stack / CTA / badge TEXT (new copy)
    • The exact hero variant (which condenser, which house, which photo)
    • The price NUMBER (per the price library)

  Do NOT introduce styling decisions that aren't visible in the reference.
  Do NOT pick a "fresh palette" — that earlier instruction is overridden
  by this priority block.

PRIORITY 2.5 — LOCKED COMPONENTS = PASTE, DO NOT REDRAW
  Locked component images (house diagram, condenser, indoor unit,
  controller, ducting, outlet, client photo) are FINISHED ASSETS. The
  output ad must contain them PIXEL-IDENTICAL to the source — same
  shape, same colours, same angles, same shadows, same count.

  Treat the attached component as a sticker that gets pasted ONCE onto
  the canvas. Do NOT regenerate, redraw, restyle, multiply, mirror,
  fan, array, triptych, or "produce variations" of the locked component.
  Re-rendering the diagram is a violation. Drawing two houses where the
  source shows one house is a violation. Drawing the same condenser
  twice is a violation.

  When you compose the prompt for gpt-image-2, you MUST include this
  language verbatim (paraphrase only for flow):
    "The attached locked component (e.g. IMAGE 3, the house diagram) is
     a FINISHED ASSET. Place it on the canvas at [position] — paste the
     source pixels, do not redraw. The output must contain EXACTLY ONE
     copy of this asset, matching the source pixel-for-pixel except for
     position and scale. If you are about to render two houses or two
     condensers — render exactly ONE instead. The source shows the
     canonical count and shape. Count: 1. No duplicates, no mirror, no
     trio, no array, no fan-out, no triptych, no perspective variants."

  This applies to: house diagrams, condensers, indoor units, controllers,
  ducting components, outlets, client team/owner/van photos.

  Brand logos in the bottom strip are the ONE exception — multiple logos
  appear because multiple logo FILES are attached (one per brand). Each
  logo is still pasted once.

PRIORITY 3 — MASTER GLOBAL HARD RULES (HR01–HR19)
  Apply only after Priority 1 and Priority 2 are satisfied. These remain
  important but defer to archetype-specific rules on direct conflict.

PRIORITY 4 — GENERAL CRAFT GUIDANCE (everything else in this system prompt)
  Patterns, gold standards, vision practices, etc. Apply when not in conflict
  with the above.

When you compose the prompt to ChatGPT Image, make Priority 1 and Priority 2
visible in the prompt body — don't just hide them in the global hard rules
block. The reader (gpt-image-2) needs to know the archetype-specific rules
and the structural template are non-negotiable.
═══════════════════════════════════════════════════════════════
`;


async function imageContentBlock(ref, label) {
  // ref can be a disk path, a /assets/ URL, an https Blob URL, or a storage key.
  const media_type = mimeFromRef(ref) || MIME_BY_EXT[extname(ref).toLowerCase()];
  if (!media_type || media_type === 'application/octet-stream') {
    throw new Error(`unsupported image type for Claude: ${ref}`);
  }
  const buf = await loadBuffer(ref);
  return [
    { type: 'text', text: `[${label}]` },
    { type: 'image', source: { type: 'base64', media_type, data: buf.toString('base64') } },
  ];
}

function pricingFor(model) {
  const key = model.replace(/\[.*\]$/, '').trim();
  return PRICING[key] || PRICING['claude-opus-4-7'];
}

function calcCost(model, usage) {
  const p = pricingFor(model);
  const ci = usage.cache_creation_input_tokens || 0;
  const cr = usage.cache_read_input_tokens || 0;
  const i  = usage.input_tokens || 0;
  const o  = usage.output_tokens || 0;
  return (
    (i  * p.input)      / 1e6 +
    (ci * p.cacheWrite) / 1e6 +
    (cr * p.cacheRead)  / 1e6 +
    (o  * p.output)     / 1e6
  );
}

// Strip preamble like "Here is the prompt:" and code fences if Claude leaks them
// despite explicit instructions not to.
function stripPreamble(text) {
  let t = text.trim();
  // Drop leading "Here is the prompt:" / "Here's the composed prompt:" etc.
  t = t.replace(/^(here(?:'s| is)?[^\n]{0,80}prompt[^\n]*:\s*\n+)/i, '');
  // Drop wrapping ``` fences
  t = t.replace(/^```[a-z]*\s*\n/, '').replace(/\n```\s*$/, '');
  return t.trim();
}

export async function composePrompt({
  systemPrompt,
  userMessage,
  attachments,
  thinkingBudget = THINKING_BUDGET,
  maxTokens = MAX_TOKENS,
  extraSystemAppend = '',
}) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');
  const model = process.env.ANTHROPIC_MODEL || 'claude-opus-4-7';

  // Inline the 8 gold-standard prompts into the master prompt (huge quality lever).
  const augmented = await inlineGoldStandards(systemPrompt);
  // Always append the operator-mandated rule priority + reference-as-template
  // directive — survives edits to master-prompt.md.
  const finalSystem = augmented + '\n\n' + RULE_PRIORITY_DIRECTIVE +
    (extraSystemAppend ? '\n\n' + extraSystemAppend : '');

  // Build user content: image attachments first, then the text brief.
  const userContent = [];
  for (const att of attachments) {
    const blocks = await imageContentBlock(att.path, att.label);
    userContent.push(...blocks);
  }
  userContent.push({ type: 'text', text: userMessage });

  const systemBlocks = [
    { type: 'text', text: finalSystem, cache_control: { type: 'ephemeral' } },
  ];

  const body = {
    model,
    max_tokens: maxTokens,
    system: systemBlocks,
    messages: [{ role: 'user', content: userContent }],
    // Opus 4.7 adaptive thinking — model decides how much to think; we cap effort.
    thinking: { type: 'adaptive' },
    output_config: { effort: 'high' },
  };

  const r = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  if (!r.ok) {
    const errBody = await r.text();
    throw new Error(`Anthropic ${r.status}: ${errBody.slice(0, 800)}`);
  }

  const json = await r.json();
  // Filter out thinking blocks — only keep the actual text output.
  const promptText = stripPreamble(
    (json.content || [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
  );

  const usage = json.usage || {};
  const costUsd = calcCost(model, usage);

  return {
    promptText,
    usage,
    costUsd,
    model,
    stopReason: json.stop_reason,
  };
}
