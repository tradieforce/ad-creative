// The orchestrator — Premium Quality Pipeline.
//
// PIPELINE STAGES:
//   1. RESOLVE   — archetype DNA + client + city + price + components + photos
//   2. ATTACH    — reference ad + gold-output + components + client photos
//   3. COMPOSE   — Claude Opus + extended thinking + gold-standard few-shots → prompt v1
//   4. CRITIQUE  — Claude reviews its own prompt vs gold + rules + DNA → prompt v2
//   5. RENDER    — gpt-image-2 high quality, n=N candidates in parallel
//   6. PICK BEST — Claude vision picks best with structured JSON judgment
//   7. UPSCALE   — sharp Lanczos3 (+ Real-ESRGAN if Replicate token set)
//   8. PERSIST   — best PNG + alt PNGs + sidecar metadata + ads + spend log
//
// All persistence goes through `db` (FS or Postgres) and `storage` (FS or Blob).

import { basename } from 'node:path';
import { db } from './db.js';
import { storage, loadBuffer } from './storage.js';
import { slugForCode } from './archetypeSlug.js';
import { composePrompt } from './composePrompt.js';
import { critiquePromptAndRefine } from './critic.js';
import { renderImageBestOfN } from './renderImage.js';
import { pickBestImage } from './pickBest.js';
import { upscalePipeline } from './upscale.js';
import { goldOutputImagePath } from './goldStandards.js';

function nextAdId() {
  return 'ad_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
}
function nowIso() { return new Date().toISOString(); }

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
  lines.push('ARCHETYPE-SPECIFIC RULES (PRIORITY 1 — these win on conflict):');
  for (const r of (archetype.rules || [])) lines.push(`  - ${r}`);
  lines.push('');
  lines.push('ASSETS ATTACHED (look at them — they are in this message):');
  let n = 1;
  lines.push(`  - IMAGE ${n++}: Reference ad for ${archetype.code} (PRIORITY 2: structural template — mirror its composition)`);
  if (hasGoldOutput) {
    lines.push(`  - IMAGE ${n++}: GOLD STANDARD output for ${archetype.code} — quality bar, calibration only`);
  }
  for (const c of components) {
    lines.push(`  - IMAGE ${n++}: Locked component "${c.key}" (${c.category}) — ${c.description || ''}. Use AS-IS per HR02.`);
  }
  for (const ph of attach_client_photos) {
    lines.push(`  - IMAGE ${n++}: Client photo "${ph}" — use EXACTLY as provided per HR04.`);
  }
  lines.push('');
  lines.push('Compose the ChatGPT-ready image prompt now. Output only the prompt.');
  return lines.join('\n');
}

// Resolve "asset reference" used by upload sources (component imagePath, ref
// ad on disk/Blob, client photo). Returns a "ref" string usable by loadBuffer.
async function resolveReferenceAd(code) {
  const slug = slugForCode(code);
  if (!slug) return null;
  // Try common extensions in storage.
  for (const ext of ['png', 'jpg', 'jpeg', 'webp']) {
    const key = `reference-ads/${slug}/reference.${ext}`;
    try { await storage.get(key); return key; } catch { /* try next */ }
  }
  return null;
}

async function resolveClientPhotoRefs(client_id, filenames) {
  if (!client_id || !filenames || filenames.length === 0) return [];
  const keys = await storage.list(`client-uploads/${client_id}`).catch(() => []);
  const lookup = new Map();
  for (const k of keys) lookup.set(basename(k.split('?')[0]), k);
  const out = [];
  for (const fname of filenames) {
    const k = lookup.get(basename(fname));
    if (k) out.push({ ref: k, filename: basename(fname) });
  }
  return out;
}

export async function generateAd(input) {
  const ad_id = nextAdId();

  // ── STAGE 1: RESOLVE ──────────────────────────────────────────────────────
  const archetypes = await db.readDoc('archetypes');
  const archetype = (archetypes || []).find((a) => a.code === input.archetype);
  if (!archetype) throw Object.assign(new Error('archetype not found: ' + input.archetype), { status: 400 });

  let client = input.client || null;
  if (!client) {
    if (!input.client_id) throw Object.assign(new Error('client_id or inline client required'), { status: 400 });
    client = await db.readClient(input.client_id);
  }
  const city = input.city || client.city || (client.service_areas?.find((a) => a.primary)?.name) || '';
  const prices = await db.readDoc('prices');
  const priceRow = (prices || []).find((p) => p.city === city) || null;

  // ── STAGE 2: ATTACH ───────────────────────────────────────────────────────
  const attachments = [];

  const refKey = await resolveReferenceAd(archetype.code);
  if (refKey) {
    attachments.push({ path: refKey, label: `IMAGE 1 — Reference ad for ${archetype.code} (PRIORITY 2 structural template)` });
  } else {
    console.warn(`[generate] no reference ad found for ${archetype.code}`);
  }

  // Gold-standard output (if uploaded) — always tried; goldOutputImagePath
  // currently looks at filesystem only, so it's best-effort.
  const goldOut = await goldOutputImagePath(archetype.code).catch(() => null);
  let nextImg = 2;
  if (goldOut) {
    attachments.push({ path: goldOut, label: `IMAGE ${nextImg++} — GOLD STANDARD output for ${archetype.code} (quality bar)` });
  }

  // Components — imagePath is either a /assets/... URL (FS) or https://blob... (prod).
  const allComponents = await db.readDoc('components');
  const componentsByKey = new Map((allComponents || []).map((c) => [c.key, c]));
  const components = (input.component_keys || []).map((k) => componentsByKey.get(k)).filter(Boolean);
  for (const c of components) {
    if (!c.imagePath) { console.warn(`[generate] component has no imagePath: ${c.key}`); continue; }
    attachments.push({ path: c.imagePath, label: `IMAGE ${nextImg++} — Locked component ${c.key} (${c.category}) · USE AS-IS per HR02` });
  }

  // Client photos
  const photoRefs = await resolveClientPhotoRefs(client.id, input.attach_client_photos || []);
  const clientPhotoFilenames = [];
  for (const { ref, filename } of photoRefs) {
    attachments.push({ path: ref, label: `IMAGE ${nextImg++} — Client photo ${filename} · USE EXACTLY AS PROVIDED per HR04` });
    clientPhotoFilenames.push(filename);
  }

  // ── STAGE 3: COMPOSE (Claude + extended thinking + gold standards) ───────
  const systemPrompt = await db.readDoc('master-prompt');
  const userMessage = buildUserMessage({
    archetype, client, city,
    picks: input.picks || {},
    components, attach_client_photos: clientPhotoFilenames, priceRow,
    hasGoldOutput: !!goldOut,
  });

  let composeV1, composeV2 = null, composedFinal;
  if (input.prompt_override && input.prompt_override.trim().length > 0) {
    composedFinal = {
      promptText: input.prompt_override,
      model: 'operator-edited', usage: {}, costUsd: 0, stopReason: 'operator_provided',
    };
    composeV1 = composedFinal;
  } else {
    composeV1 = await composePrompt({ systemPrompt: systemPrompt || '', userMessage, attachments });
    await db.appendSpend({ ad_id, stage: 'compose_v1', model: composeV1.model, usage: composeV1.usage, costUsd: composeV1.costUsd });
    composedFinal = composeV1;
  }

  // ── STAGE 4: CRITIQUE & REFINE ────────────────────────────────────────────
  if (!input.prompt_override && !input.skip_critique) {
    composeV2 = await critiquePromptAndRefine({
      systemPrompt: systemPrompt || '',
      originalUserMessage: userMessage,
      composedPrompt: composeV1.promptText,
      attachments,
    });
    await db.appendSpend({ ad_id, stage: 'compose_v2_refined', model: composeV2.model, usage: composeV2.usage, costUsd: composeV2.costUsd });
    composedFinal = composeV2;
  }

  if (input.compose_only) {
    return {
      ad_id, archetype: archetype.code, client_id: client.id || null, city,
      prompt: {
        text: composedFinal.promptText,
        textV1: composeV1.promptText,
        critiqueApplied: !!composeV2,
        model: composedFinal.model, usage: composedFinal.usage,
        costUsd: composeV1.costUsd + (composeV2 ? composeV2.costUsd : 0),
      },
      image: null,
      attachments: attachments.map((a) => ({ label: a.label, path: a.path })),
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
  await db.appendSpend({
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
    await db.appendSpend({ ad_id, stage: 'pick_best', model: pickResult.model, bestIndex, costUsd: pickResult.costUsd });
  }

  // ── STAGE 7: UPSCALE best (sharp Lanczos3 +/- Real-ESRGAN) ────────────────
  const upscaled = await upscalePipeline({ inputBuffer: renderResult.candidates[bestIndex], archetype });

  // ── STAGE 8: PERSIST (storage + db) ──────────────────────────────────────
  const clientFolder = client.id || 'adhoc';
  const baseKey = `generated-ads/${clientFolder}/${ad_id}`;
  const { url: bestUrl } = await storage.put(`${baseKey}.png`, upscaled.png1080, 'image/png');
  const { url: hd2kUrl } = await storage.put(`${baseKey}_2k.png`, upscaled.png2160, 'image/png');
  const hdUrls = { '2k': hd2kUrl };
  if (upscaled.png4320) {
    const { url } = await storage.put(`${baseKey}_4k.png`, upscaled.png4320, 'image/png');
    hdUrls['4k'] = url;
  }

  // Snapshot the reference ad bytes to a per-ad path so version history is
  // honest — if the operator swaps the archetype's reference next month, this
  // ad's record still points at the reference that was actually used.
  let referenceSnapshotUrl = null;
  if (refKey) {
    try {
      const refBuf = await loadBuffer(refKey);
      const ext = (refKey.toLowerCase().endsWith('.jpg') || refKey.toLowerCase().endsWith('.jpeg')) ? 'jpg'
                : refKey.toLowerCase().endsWith('.webp') ? 'webp' : 'png';
      const ct  = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
      const refSnap = await storage.put(`${baseKey}_reference.${ext}`, refBuf, ct);
      referenceSnapshotUrl = refSnap.url;
    } catch (e) {
      console.warn('[generate] reference snapshot failed:', e.message);
    }
  }

  // Save EVERY candidate so the operator can manually pick a different one.
  const candidateUrls = [];
  for (let i = 0; i < renderResult.candidates.length; i++) {
    const { url } = await storage.put(`${baseKey}_c${i}.png`, renderResult.candidates[i], 'image/png');
    candidateUrls.push(url);
  }
  const altUrls = candidateUrls.filter((_, i) => i !== bestIndex);

  const totalCostUsd =
    composeV1.costUsd +
    (composeV2 ? composeV2.costUsd : 0) +
    renderResult.costUsd +
    (pickResult ? pickResult.costUsd : 0);

  // Sidecar metadata as JSON in storage (+ also returned in response).
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
      total_cost_usd: totalCostUsd,
    },
    candidate_urls: candidateUrls,
    full_prompt_v1: composeV1.promptText,
    full_prompt_v2_refined: composeV2 ? composeV2.promptText : null,
    full_prompt_used: composedFinal.promptText,
  };
  await storage.put(`${baseKey}.json`, Buffer.from(JSON.stringify(meta, null, 2)), 'application/json').catch((e) => {
    console.warn('[generate] sidecar JSON save failed:', e.message);
  });

  // Append to ads. promoted_at controls which version is "current" for the
  // client-page slot lookup — defaults to created so newest is current; the
  // /api/ads/:id/promote endpoint bumps it for older-version promotion.
  const nowFull = nowIso();
  const adRecord = {
    id: ad_id,
    archetype: archetype.code,
    client_id: client.id || null,
    city,
    headline: input.picks?.headline || '',
    created: nowFull,                      // full ISO so version pills can sort precisely
    promoted_at: nowFull,                  // newest is current by default
    image_url: bestUrl,
    candidate_urls: candidateUrls,
    hd_urls: hdUrls,
    reference_url: referenceSnapshotUrl,   // null if snapshot failed; UI falls back to live reference
    picks_used: input.picks || {},
    component_keys: components.map((c) => c.key),
    prompt_text: composedFinal.promptText,
    total_cost_usd: totalCostUsd,
  };
  await db.appendAd(adRecord);

  return {
    ad_id, archetype: archetype.code, client_id: client.id || null, city,
    prompt: {
      text: composedFinal.promptText,
      textV1: composeV1.promptText,
      critiqueApplied: !!composeV2,
      model: composedFinal.model, usage: composedFinal.usage,
      costUsd: composeV1.costUsd + (composeV2 ? composeV2.costUsd : 0),
    },
    image: {
      url: bestUrl, altUrls, candidateUrls,
      bestIndex,
      hdUrls,
      upscaleMethod: upscaled.method,
      model: renderResult.model,
      size: '1080x1080 (upscaled from ' + renderResult.size + ' via ' + upscaled.method + ')',
      quality: renderResult.quality,
      candidates: renderResult.succeeded,
      costUsd: renderResult.costUsd,
    },
    pickBest: pickResult ? {
      bestIndex, reasoning: pickResult.reasoning, perCandidate: pickResult.perCandidate, costUsd: pickResult.costUsd,
    } : null,
    attachments: attachments.map((a) => ({ label: a.label, path: a.path })),
    totalCostUsd,
    userMessage,
  };
}
