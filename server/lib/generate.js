// The orchestrator — Premium Quality Pipeline.
//
// PIPELINE STAGES:
//   1. RESOLVE   — archetype DNA + client + city + price + components + photos
//   2. ATTACH    — reference ad + gold-output for archetype + components + client photos
//   3. COMPOSE   — Claude Opus + extended thinking + gold-standard few-shots → prompt v1
//   4. CRITIQUE  — Claude reviews its own prompt vs gold + rules + DNA → prompt v2 (refined)
//   5. RENDER    — gpt-image-2 high quality, n=3 candidates in parallel
//   6. PICK BEST — Claude vision picks best of 3 with structured JSON judgment
//   7. UPSCALE   — sharp Lanczos3 1024 → 1080 (HR10)
//   8. PERSIST   — best PNG + alt PNGs + sidecar JSON + ads.json append + spend log
//
// Inputs (from POST /api/generate):
//   {
//     archetype, client_id|client, city,
//     picks: { headline, sub_headline, value_stack, cta, badge },
//     component_keys: [...],
//     attach_client_photos: [...],
//     quality: "low"|"medium"|"high"|"auto"   (image render quality, default "high")
//     n_candidates: 1|2|3|4                    (default 3 — best-of-N)
//     skip_critique: bool                      (default false — set true for fast-but-rough)
//     compose_only: bool                       (default false — skip render entirely)
//   }

import { promises as fs } from 'node:fs';
import { join, basename, dirname } from 'node:path';
import { ASSETS_DIR, DATA_DIR, FILES, ROOT } from './paths.js';
import { readJSON, readText, patchJSON } from './store.js';
import { slugForCode } from './archetypeSlug.js';
import { composePrompt } from './composePrompt.js';
import { critiquePromptAndRefine } from './critic.js';
import { renderImageBestOfN } from './renderImage.js';
import { pickBestImage } from './pickBest.js';
import { upscalePipeline } from './upscale.js';
import { goldOutputImagePath } from './goldStandards.js';

const SPEND_LOG = join(DATA_DIR, '_cache', 'spend.jsonl');

function nextAdId() {
  return 'ad_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
}
function nowIso() { return new Date().toISOString(); }

function urlPathToDisk(urlPath) {
  if (!urlPath) return null;
  if (urlPath.startsWith('/assets/')) return join(ROOT, urlPath.slice(1));
  return urlPath;
}

async function loadClient(client_id) {
  return await readJSON(join(FILES.clientsDir, `${client_id}.json`));
}

async function loadComponentsByKey(keys) {
  const all = await readJSON(FILES.components, []);
  const byKey = new Map(all.map((c) => [c.key, c]));
  return keys.map((k) => byKey.get(k)).filter(Boolean);
}

function buildUserMessage({ archetype, client, city, picks, components, attach_client_photos, priceRow, hasGoldOutput }) {
  const lines = [];
  lines.push('PACK MANIFEST: single-ad generation (Layer 1 single-shot — no pack-balance enforcement this run).');
  lines.push('');
  lines.push('TARGET AD:');
  lines.push(`  Archetype: ${archetype.code} — ${archetype.name}`);
  lines.push(`  Funnel stage: ${archetype.funnel_stage || ''}`);
  lines.push(`  Tagline: ${archetype.tagline || ''}`);
  lines.push('');
  lines.push('CLIENT CONTEXT:');
  lines.push(`  Business name: ${client.business_name || ''}`);
  lines.push(`  City (primary): ${city}`);
  lines.push(`  State: ${client.state || ''}`);
  lines.push(`  Region: ${client.region || ''}`);
  if (Array.isArray(client.service_areas) && client.service_areas.length) {
    lines.push('  Service areas:');
    for (const a of client.service_areas) {
      lines.push(`    - ${a.name || ''}${a.postcode ? ' ' + a.postcode : ''}${a.primary ? ' (PRIMARY)' : ''}${a.notes ? ' — ' + a.notes : ''}`);
    }
  }
  lines.push(`  Brands sold: ${(client.brands_sold || []).join(', ') || '(none specified)'}`);
  lines.push(`  Years in business: ${client.years_in_business || 0}`);
  lines.push(`  Google review count: ${client.google_review_count || 0}`);
  lines.push(`  Install guarantee days: ${client.install_guarantee_days || 0}`);
  lines.push(`  Current promo %: ${client.current_promo_pct || 0}`);
  lines.push(`  Default per-week price: ${client.default_per_week_price || ''}`);
  lines.push(`  Family owned: ${!!client.family_owned}`);
  lines.push(`  Australian owned: ${!!client.australian_owned}`);
  lines.push(`  Has team photo: ${!!client.team_photos_uploaded}`);
  lines.push(`  Has owner photo: ${!!client.owner_photos_uploaded}`);
  lines.push(`  Has van photo: ${!!client.van_photos_uploaded}`);
  lines.push('');
  lines.push('PRICE LIBRARY DATA FOR THIS CITY:');
  if (priceRow) {
    lines.push(`  Per-week: ${priceRow.perWeek || '(not set)'}`);
    lines.push(`  Fixed:    ${priceRow.fixed    || '(not set)'}`);
    lines.push(`  Anchor:   ${priceRow.anchor   || '(not set)'}`);
    lines.push(`  Rebate:   ${priceRow.rebate   || '(not set)'}`);
  } else {
    lines.push('  (no price library row for this city — Per-week defaults apply)');
  }
  lines.push('');
  lines.push('PICKED VARIABLES (operator-selected from variable_inputs library):');
  if (picks.headline)      lines.push(`  Headline:      "${picks.headline}"`);
  if (picks.sub_headline)  lines.push(`  Sub-headline:  "${picks.sub_headline}"`);
  if (picks.value_stack)   lines.push(`  Value stack:   ${picks.value_stack}`);
  if (picks.cta)           lines.push(`  CTA:           "${picks.cta}"`);
  if (picks.badge)         lines.push(`  Badge:         "${picks.badge}"`);
  lines.push('');
  lines.push('ARCHETYPE-SPECIFIC RULES (from data/archetypes.json):');
  for (const r of (archetype.rules || [])) lines.push(`  - ${r}`);
  lines.push('');
  lines.push('ASSETS ATTACHED (look at them — they are in this message):');
  let n = 1;
  lines.push(`  - IMAGE ${n++}: Reference ad for ${archetype.code} (style guide for density/hierarchy/feel; do NOT copy specifics)`);
  if (hasGoldOutput) {
    lines.push(`  - IMAGE ${n++}: GOLD-STANDARD OUTPUT for ${archetype.code} — production-approved exemplar showing the quality bar this archetype must meet. Use as a calibration reference, NOT to copy.`);
  }
  for (const c of components) {
    lines.push(`  - IMAGE ${n++}: Locked component "${c.key}" (${c.category}) — ${c.description || ''}. Use AS-IS per HR02.`);
  }
  for (const ph of attach_client_photos) {
    lines.push(`  - IMAGE ${n++}: Client photo "${ph}" — use EXACTLY as provided per HR04 (no AI face modification).`);
  }
  lines.push('');
  lines.push('Compose the ChatGPT-ready image prompt now. Output only the prompt — no preamble, no commentary, no markdown headers, no code fences.');
  return lines.join('\n');
}

async function logSpend(entry) {
  await fs.mkdir(join(DATA_DIR, '_cache'), { recursive: true });
  const line = JSON.stringify({ at: nowIso(), ...entry }) + '\n';
  await fs.appendFile(SPEND_LOG, line, 'utf8');
}

export async function generateAd(input) {
  const ad_id = nextAdId();

  // ── STAGE 1: RESOLVE ──────────────────────────────────────────────────────
  const archetypes = await readJSON(FILES.archetypes, []);
  const archetype = archetypes.find((a) => a.code === input.archetype);
  if (!archetype) throw Object.assign(new Error('archetype not found: ' + input.archetype), { status: 400 });

  let client = input.client || null;
  if (!client) {
    if (!input.client_id) throw Object.assign(new Error('client_id or inline client required'), { status: 400 });
    client = await loadClient(input.client_id);
  }
  const city = input.city || client.city || (client.service_areas?.find((a) => a.primary)?.name) || '';
  const prices = await readJSON(FILES.prices, []);
  const priceRow = prices.find((p) => p.city === city) || null;

  // ── STAGE 2: ATTACH ───────────────────────────────────────────────────────
  const attachments = [];

  const refSlug = slugForCode(archetype.code);
  if (refSlug) {
    const refDisk = join(ASSETS_DIR, 'reference-ads', refSlug, 'reference.png');
    try {
      await fs.access(refDisk);
      attachments.push({ path: refDisk, label: `IMAGE 1 — Reference ad for ${archetype.code} (style guide; do not copy specifics)` });
    } catch { console.warn(`[generate] no reference.png for ${archetype.code}`); }
  }

  // Gold-standard output for this archetype, if uploaded.
  const goldOut = await goldOutputImagePath(archetype.code);
  let nextImg = 2;
  if (goldOut) {
    attachments.push({ path: goldOut, label: `IMAGE ${nextImg++} — GOLD STANDARD output for ${archetype.code} (quality bar — calibration only, do not copy)` });
  }

  const components = await loadComponentsByKey(input.component_keys || []);
  for (const c of components) {
    const disk = urlPathToDisk(c.imagePath);
    if (!disk) continue;
    try {
      await fs.access(disk);
      attachments.push({ path: disk, label: `IMAGE ${nextImg++} — Locked component ${c.key} (${c.category}) · USE AS-IS per HR02` });
    } catch { console.warn(`[generate] component image missing: ${c.key} → ${disk}`); }
  }

  const clientPhotoFilenames = [];
  if (client.id && Array.isArray(input.attach_client_photos)) {
    const dir = join(ASSETS_DIR, 'client-uploads', client.id);
    for (const fname of input.attach_client_photos) {
      const safe = basename(fname);
      const disk = join(dir, safe);
      try {
        await fs.access(disk);
        attachments.push({ path: disk, label: `IMAGE ${nextImg++} — Client photo ${safe} · USE EXACTLY AS PROVIDED per HR04` });
        clientPhotoFilenames.push(safe);
      } catch { console.warn(`[generate] client photo missing: ${disk}`); }
    }
  }

  // ── STAGE 3: COMPOSE (Claude + extended thinking + gold standards) ───────
  // OR: bypass entirely if prompt_override is set (operator-edited prompt mode).
  const systemPrompt = await readText(FILES.masterPrompt, '');
  const userMessage = buildUserMessage({
    archetype, client, city,
    picks: input.picks || {},
    components, attach_client_photos: clientPhotoFilenames, priceRow,
    hasGoldOutput: !!goldOut,
  });

  let composeV1, composeV2 = null, composedFinal;
  if (input.prompt_override && input.prompt_override.trim().length > 0) {
    // Operator-edited prompt — skip Claude entirely. Use the override directly.
    composedFinal = {
      promptText: input.prompt_override,
      model: 'operator-edited',
      usage: {},
      costUsd: 0,
      stopReason: 'operator_provided',
    };
    composeV1 = composedFinal;  // no v1 — they're identical
  } else {
    composeV1 = await composePrompt({ systemPrompt, userMessage, attachments });
    await logSpend({
      ad_id, stage: 'compose_v1', model: composeV1.model,
      usage: composeV1.usage, costUsd: composeV1.costUsd,
    });
    composedFinal = composeV1;
  }

  // ── STAGE 4: CRITIQUE & REFINE (skipped when prompt_override or skip_critique) ──
  if (!input.prompt_override && !input.skip_critique) {
    composeV2 = await critiquePromptAndRefine({
      systemPrompt,
      originalUserMessage: userMessage,
      composedPrompt: composeV1.promptText,
      attachments,
    });
    await logSpend({
      ad_id, stage: 'compose_v2_refined', model: composeV2.model,
      usage: composeV2.usage, costUsd: composeV2.costUsd,
    });
    composedFinal = composeV2;
  }

  if (input.compose_only) {
    return {
      ad_id, archetype: archetype.code, client_id: client.id || null, city,
      prompt: {
        text: composedFinal.promptText,
        textV1: composeV1.promptText,
        critiqueApplied: !!composeV2,
        model: composedFinal.model,
        usage: composedFinal.usage,
        costUsd: composeV1.costUsd + (composeV2 ? composeV2.costUsd : 0),
      },
      image: null,
      attachments: attachments.map((a) => ({ label: a.label, path: a.path.replace(ROOT, '') })),
      totalCostUsd: composeV1.costUsd + (composeV2 ? composeV2.costUsd : 0),
      userMessage,
    };
  }

  // ── STAGE 5: RENDER best-of-N ─────────────────────────────────────────────
  const nCandidates = Math.max(1, Math.min(4, input.n_candidates ?? 3));
  const renderResult = await renderImageBestOfN({
    prompt: composedFinal.promptText,
    attachments,
    quality: input.quality || 'high',
    n: nCandidates,
  });
  await logSpend({
    ad_id, stage: 'render_n', model: renderResult.model,
    quality: renderResult.quality, size: renderResult.size,
    requested: renderResult.requested, succeeded: renderResult.succeeded,
    costUsd: renderResult.costUsd,
  });

  // ── STAGE 6: PICK BEST (Claude vision) ────────────────────────────────────
  let pickResult = null;
  let bestIndex = 0;
  if (renderResult.candidates.length > 1) {
    pickResult = await pickBestImage({
      promptText: composedFinal.promptText,
      archetype,
      candidateBuffers: renderResult.candidates,
      goldOutputPath: goldOut,
    });
    bestIndex = pickResult.bestIndex;
    await logSpend({
      ad_id, stage: 'pick_best', model: pickResult.model,
      bestIndex, costUsd: pickResult.costUsd,
    });
  }

  // ── STAGE 7: UPSCALE best — full HD pipeline (1080 + 2160 + 4k if Replicate) ──
  const upscaled = await upscalePipeline({
    inputBuffer: renderResult.candidates[bestIndex],
    archetype,
  });

  // ── STAGE 8: PERSIST ──────────────────────────────────────────────────────
  const clientFolder = client.id || 'adhoc';
  const outputDir = join(ASSETS_DIR, 'generated-ads', clientFolder);
  await fs.mkdir(outputDir, { recursive: true });
  const bestPath = join(outputDir, `${ad_id}.png`);
  await fs.writeFile(bestPath, upscaled.png1080);
  // HD sidecars
  await fs.writeFile(bestPath.replace(/\.png$/, '_2k.png'), upscaled.png2160);
  if (upscaled.png4320) await fs.writeFile(bestPath.replace(/\.png$/, '_4k.png'), upscaled.png4320);

  // Save EVERY candidate at its native render size (not just the alts) so the
  // operator can manually pick a different one later. Index 0..N-1 in the
  // order returned by the renderer.
  const candidateUrls = [];
  for (let i = 0; i < renderResult.candidates.length; i++) {
    const candPath = join(outputDir, `${ad_id}_c${i}.png`);
    await fs.writeFile(candPath, renderResult.candidates[i]);
    candidateUrls.push(`/assets/generated-ads/${clientFolder}/${ad_id}_c${i}.png`);
  }
  const altUrls = candidateUrls.filter((_, i) => i !== bestIndex);

  const totalCostUsd =
    composeV1.costUsd +
    (composeV2 ? composeV2.costUsd : 0) +
    renderResult.costUsd +
    (pickResult ? pickResult.costUsd : 0);

  // Sidecar JSON — full audit trail.
  const meta = {
    ad_id, created: nowIso(),
    archetype: archetype.code, client_id: client.id || null, city,
    picks: input.picks || {},
    component_keys: components.map((c) => c.key),
    client_photos: clientPhotoFilenames,
    pipeline: {
      compose_v1: { model: composeV1.model, usage: composeV1.usage, costUsd: composeV1.costUsd },
      compose_v2_refined: composeV2 ? { model: composeV2.model, usage: composeV2.usage, costUsd: composeV2.costUsd } : null,
      render: { model: renderResult.model, size: renderResult.size, quality: renderResult.quality, requested: renderResult.requested, succeeded: renderResult.succeeded, costUsd: renderResult.costUsd },
      pick_best: pickResult ? { model: pickResult.model, bestIndex, reasoning: pickResult.reasoning, perCandidate: pickResult.perCandidate, costUsd: pickResult.costUsd } : null,
      upscale: { from: renderResult.size, method: upscaled.method, sizes_written: ['1080', '2160', upscaled.png4320 ? '4320' : null].filter(Boolean) },
      lessons_learned_injected: !!lessons,
      total_cost_usd: totalCostUsd,
    },
    candidate_urls: candidateUrls,
    full_prompt_v1: composeV1.promptText,
    full_prompt_v2_refined: composeV2 ? composeV2.promptText : null,
    full_prompt_used: composedFinal.promptText,
  };
  await fs.writeFile(bestPath.replace(/\.png$/, '.json'), JSON.stringify(meta, null, 2));

  // Append to data/ads.json so it shows in the Ad Database.
  const adRecord = {
    id: ad_id,
    archetype: archetype.code,
    client_id: client.id || null,
    city,
    headline: input.picks?.headline || '',
    created: nowIso().slice(0, 10),
    image_url: `/assets/generated-ads/${clientFolder}/${ad_id}.png`,
    prompt_text: composedFinal.promptText,
  };
  await patchJSON(FILES.ads, (list) => {
    const arr = Array.isArray(list) ? list : [];
    arr.unshift(adRecord);
    return arr;
  }, []);

  return {
    ad_id, archetype: archetype.code, client_id: client.id || null, city,
    prompt: {
      text: composedFinal.promptText,
      textV1: composeV1.promptText,
      critiqueApplied: !!composeV2,
      model: composedFinal.model,
      usage: composedFinal.usage,
      costUsd: composeV1.costUsd + (composeV2 ? composeV2.costUsd : 0),
    },
    image: {
      url: adRecord.image_url,
      altUrls,
      candidateUrls,
      bestIndex,
      hdUrls: {
        '2k': adRecord.image_url.replace(/\.png$/, '_2k.png'),
        ...(upscaled.png4320 ? { '4k': adRecord.image_url.replace(/\.png$/, '_4k.png') } : {}),
      },
      upscaleMethod: upscaled.method,
      model: renderResult.model,
      size: '1080x1080 (upscaled from ' + renderResult.size + ' via ' + upscaled.method + ')',
      quality: renderResult.quality,
      candidates: renderResult.succeeded,
      costUsd: renderResult.costUsd,
    },
    pickBest: pickResult ? {
      bestIndex,
      reasoning: pickResult.reasoning,
      perCandidate: pickResult.perCandidate,
      costUsd: pickResult.costUsd,
    } : null,
    attachments: attachments.map((a) => ({ label: a.label, path: a.path.replace(ROOT, '') })),
    totalCostUsd,
    userMessage,
  };
}
