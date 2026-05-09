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

PRIORITY 2 — REFERENCE AD AS GUIDE, NOT TRACING PAPER
  IMAGE 1 (the reference ad attached for this archetype) is the operator's
  proven template for this archetype. It shows where things go, how the
  hierarchy works, what colour family feels right, and what overall vibe
  the archetype is meant to hit. Treat it as a strong design brief — about
  how the operator would have done this manually — NOT as a layout to copy
  pixel-by-pixel.

  Use the reference for these (fairly tightly, but with judgement):
    • LAYOUT FAMILY — same general zone geometry (split-screen vs full
      bleed vs top-to-bottom), same approximate placement of headline /
      hero / price / CTA / badges / brand strip. Variation in exact
      positions / proportions is fine and preferred over slavish copy.
    • HIERARCHY — same elements are dominant, same elements are footer.
      The headline is still the loudest thing; the brand strip still sits
      quiet at the bottom. Don't invert.
    • PALETTE FAMILY — stay in the same colour family (e.g. cyan + navy
      + cream), but pick a fresh exact shade per generation. Don't lift
      hex codes literally — pick adjacent tones that feel cohesive. A
      different cyan, a slightly warmer cream, a different navy depth
      are all fine. Stay out of palettes that aren't in the family at
      all (no warm reds in a cool blue archetype unless the reference
      has them).
    • TYPOGRAPHY DIRECTION — match the broad type direction (heavy
      bold sans for headline, italic serif for accent words, etc.) but
      pick a fresh exact face / weight / spacing.
    • FOOTER + BADGE STYLE — same kind (pill cards vs gradient strip vs
      circular seal) but treat shape and exact styling with creative
      latitude.

  Where to take creative liberty (do this — variety per generation matters):
    • Exact palette shades and accent intensity
    • Font choices (match the direction, not the file)
    • Subtle texture, pattern, illustration accents that aren't on the
      reference but feel right for the archetype's mood
    • Composition micro-details (where exactly text sits within a zone,
      whether a corner is rounded, whether there's a thin divider)
    • Fresh hero variant from the archetype's component pool

  What stays constant per generation (from the picks block):
    • Headline / sub-headline / value-stack / CTA / badge TEXT
    • Locked component PIXELS (paste, do not redraw — see Priority 2.5)
    • Brand logo PIXELS

  Goal: an ad that feels recognisably from the same family as the
  reference, but isn't a clone. Slight creative variation in palette,
  type, and detail is the point — it keeps Meta's algorithm engaged and
  every ad in a pack feeling distinct. The reference is the "how the
  operator did it manually"; you are doing it manually-style too.

PRIORITY 2.5 — COUNT MATCHES THE REFERENCE AD, NOT THE SOURCE COMPONENT
  Locked component images are FINISHED ASSETS. The output must contain
  them in the SAME COUNT AND ORIENTATION AS SHOWN IN THE REFERENCE AD
  (IMAGE 1) — not "the model decided to add variety."

  Open IMAGE 1 (the reference) before composing. Count the visible
  instances of each component type:
    • Houses / diagrams in the reference: typically 1
    • Condensers in the reference: typically 1
    • Brand logos in the reference: typically 3 (matches the 3 attached logo files)
    • Reaction photos / client photos in the reference: typically 1

  Whatever count IMAGE 1 shows is the count the OUTPUT must have. If the
  reference shows ONE house, the output has ONE house — even if you might
  think two looks more interesting. If the reference shows ONE condenser,
  the output has ONE condenser. NEVER multiply, mirror, fan, array,
  triptych, or duplicate.

  When you compose the prompt for gpt-image-2, INCLUDE THIS LANGUAGE
  VERBATIM (paraphrase only for flow):
    "Look at IMAGE 1 (the reference ad). Count the houses [or
     condensers / diagrams / etc.] visible in it. The output must
     contain EXACTLY THAT COUNT — matching IMAGE 1's count, not
     'one more for variety'. If IMAGE 1 shows 1 house, the output
     has 1 house. The locked component (e.g. IMAGE 3) provides the
     SHAPE for that single house — paste it ONCE, pixel-identical to
     the source, matching IMAGE 1's count and rough position."

  Brand logos are the one expected exception — they appear in the count
  matching the number of logo files attached (one per brand).

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
