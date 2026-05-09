// Vision-pick the best of N candidate ads using Claude Opus.
//
// Sends Claude:
//   - The composed ChatGPT prompt that produced these candidates
//   - The archetype DNA (rules, mandatory_elements, gold standard reference)
//   - All N candidate PNGs (as in-line images)
//   - The brief judging criteria
//
// Claude returns JSON: { best_index, reasoning, defects_per_candidate }
//
// We parse strictly and fall back to candidate 0 if parsing fails.

import { promises as fs } from 'node:fs';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

const PRICING = {
  'claude-opus-4-7':    { input: 15.00, output: 75.00 },
  'claude-sonnet-4-6':  { input:  3.00, output: 15.00 },
  'claude-haiku-4-5':   { input:  1.00, output:  5.00 },
};

const SYSTEM_PROMPT = `You are the Creative Director for Tradie Force, a marketing agency for residential ducted air conditioning installers in Australia. Your job in this turn is to pick the BEST of N candidate ad images that were rendered from the same ChatGPT-ready prompt.

Judge each candidate against ALL of these criteria, in this order:

1. CLARITY (HR13) — does "DUCTED A/C" / "DUCTED AIR CONDITIONING" / "DUCTED HEATING & COOLING" appear prominently? A scroller must understand within 1 second what is being sold. THIS IS NON-NEGOTIABLE.
2. LOCKED COMPONENT INTEGRITY (HR02, HR03, HR04) — were the attached condenser / diagram / brand logos used AS-IS without distortion? Are all condensers double-fan ducted (HR03)? Are there ANY AI-generated faces (HR04 violation)?
3. ARCHETYPE FIDELITY — does the candidate match the archetype's mandatory_elements? Is it free of forbidden_elements?
4. TYPOGRAPHY & HIERARCHY — readable at thumbnail? Headlines hierarchical? No decorative-fine-print badges?
5. PALETTE & MOOD — fresh and on-brief vs templated/generic?
6. SAFE-ZONE (HR14) — ~60px padding maintained? No clipped CTAs/badges?
7. WATERMARKS (HR18) — ZERO visible stock-agency watermarks (Shutterstock, Adobe Stock, iStock, Westend61, Greenmill, etc.) — even one means rejection.
8. POLISH — anti-aliasing, kerning, alignment, no warped text, no extra fingers, no nonsense text.

Return STRICT JSON in this exact shape, nothing else:

{
  "best_index": 0|1|2|...,
  "reasoning": "two-three sentence justification for why this candidate beats the others",
  "candidates": [
    { "index": 0, "score_0_to_10": 7.5, "strengths": ["..."], "defects": ["..."] },
    { "index": 1, "score_0_to_10": 8.2, "strengths": ["..."], "defects": ["..."] },
    ...
  ]
}

Output ONLY the JSON. No preamble, no markdown, no code fence.`;

function calcCost(model, usage) {
  const p = PRICING[model.replace(/\[.*\]$/, '').trim()] || PRICING['claude-opus-4-7'];
  return ((usage.input_tokens || 0) * p.input + (usage.output_tokens || 0) * p.output) / 1e6;
}

function tryParseJson(text) {
  try { return JSON.parse(text); } catch {}
  // strip code fences if present
  const m = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (m) { try { return JSON.parse(m[1]); } catch {} }
  // find first { ... } block
  const i = text.indexOf('{');
  const j = text.lastIndexOf('}');
  if (i >= 0 && j > i) { try { return JSON.parse(text.slice(i, j + 1)); } catch {} }
  return null;
}

export async function pickBestImage({
  promptText,             // the ChatGPT prompt that produced these candidates
  archetype,              // archetype object from data/archetypes.json
  candidateBuffers,       // [Buffer, Buffer, Buffer]
  goldOutputPath = null,  // optional gold-standard PNG for this archetype
}) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');
  const model = process.env.ANTHROPIC_MODEL || 'claude-opus-4-7';

  if (candidateBuffers.length === 1) {
    return {
      bestIndex: 0,
      reasoning: 'Only one candidate produced — automatic winner.',
      perCandidate: [{ index: 0, score: null, strengths: [], defects: [] }],
      costUsd: 0,
      model,
    };
  }

  const userContent = [];

  // Optional gold reference at top.
  if (goldOutputPath) {
    try {
      const buf = await fs.readFile(goldOutputPath);
      userContent.push({ type: 'text', text: `[GOLD STANDARD — the production-approved ${archetype.code} ad. Quality bar.]` });
      userContent.push({ type: 'image', source: { type: 'base64', media_type: 'image/png', data: buf.toString('base64') } });
    } catch { /* skip */ }
  }

  userContent.push({
    type: 'text',
    text:
      `ARCHETYPE: ${archetype.code} — ${archetype.name}\n` +
      `Funnel stage: ${archetype.funnel_stage || ''}\n` +
      `Tagline: ${archetype.tagline || ''}\n\n` +
      `ARCHETYPE-SPECIFIC RULES:\n` +
      (archetype.rules || []).map((r) => `  - ${r}`).join('\n') +
      `\n\nCHATGPT PROMPT THAT PRODUCED THESE CANDIDATES:\n` +
      `\`\`\`\n${promptText}\n\`\`\`\n\n` +
      `${candidateBuffers.length} candidate ads follow. Index them 0..${candidateBuffers.length - 1} in the order presented.`,
  });

  // Add each candidate.
  for (let i = 0; i < candidateBuffers.length; i++) {
    userContent.push({ type: 'text', text: `[CANDIDATE ${i}]` });
    userContent.push({
      type: 'image',
      source: { type: 'base64', media_type: 'image/png', data: candidateBuffers[i].toString('base64') },
    });
  }

  userContent.push({
    type: 'text',
    text: 'Now judge them. Output the strict JSON described in the system prompt — nothing else.',
  });

  const body = {
    model,
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userContent }],
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
    throw new Error(`Anthropic (pickBest) ${r.status}: ${errBody.slice(0, 500)}`);
  }

  const json = await r.json();
  const text = (json.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n');
  const usage = json.usage || {};
  const costUsd = calcCost(model, usage);

  const parsed = tryParseJson(text);
  if (!parsed || typeof parsed.best_index !== 'number') {
    console.warn('[pickBest] could not parse JSON — defaulting to candidate 0. Raw output:\n', text.slice(0, 400));
    return {
      bestIndex: 0,
      reasoning: 'Parser fallback — Claude critique did not return parseable JSON.',
      perCandidate: candidateBuffers.map((_, i) => ({ index: i, score: null, strengths: [], defects: [] })),
      rawOutput: text,
      costUsd,
      model,
    };
  }

  const bestIndex = Math.max(0, Math.min(candidateBuffers.length - 1, parsed.best_index));
  return {
    bestIndex,
    reasoning: parsed.reasoning || '',
    perCandidate: (parsed.candidates || []).map((c) => ({
      index: c.index,
      score: c.score_0_to_10,
      strengths: c.strengths || [],
      defects: c.defects || [],
    })),
    rawOutput: text,
    costUsd,
    model,
  };
}
