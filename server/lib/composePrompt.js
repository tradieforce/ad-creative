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

// NOTE: a previous build of this file appended a large RULE_PRIORITY_DIRECTIVE
// onto every call's system prompt, which silently overrode the master-prompt.md
// behaviour (e.g. forced reference-mirroring against the master prompt's
// "reference guides, don't copy directly" guidance). That created a hidden
// rule layer the operator couldn't tweak through the UI. Removed.
//
// Canonical sources of behaviour are now ONLY:
//   1. data/master-prompt.md  (editable in UI: Master AI Prompt section)
//   2. data/archetypes.json  (editable in UI: Archetypes → click archetype)
//   3. data/global-rules.json  (editable in UI: Global Rules)
//
// composePrompt.js does no behaviour overrides. It only:
//   - Inlines the 8 gold-standard exemplars into the master prompt at the
//     placeholder slots (deterministic file substitution, not a rule)
//   - Sends the user message + attached images
//   - Enables extended thinking + adaptive output (model parameters)


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

  // Inline the 8 gold-standard prompts into the master prompt (huge quality
  // lever — operator's tested exemplars, deterministic file substitution).
  const augmented = await inlineGoldStandards(systemPrompt);
  const finalSystem = extraSystemAppend ? augmented + '\n\n' + extraSystemAppend : augmented;

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
