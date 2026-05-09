// One-pass simulation for all 10 archetypes against the seeded sample client.
// Picks the first option from each variable_inputs pool, picks reasonable
// components, and fires the full premium pipeline (compose → critique →
// render best-of-3 → vision pick → 4K upscale via Real-ESRGAN if available).
//
// Each archetype takes ~4–6 min. Total wall-clock: ~50–60 min sequential.
// Cost: ~$2–6 per archetype with cache; roughly $30–50 total.
//
// Outputs:
//   - assets/generated-ads/sharp_aircon/ad_*.png         canonical 1080
//   - assets/generated-ads/sharp_aircon/ad_*_2k.png      2K HD
//   - assets/generated-ads/sharp_aircon/ad_*_4k.png      4K HD (Replicate)
//   - data/_cache/simulation-report.json                 results summary
//
// Usage: node scripts/simulate-all.js
// Server must be running on localhost:3000 (npm start).

import 'dotenv/config';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';

const SERVER = process.env.SIM_SERVER || 'http://localhost:3000';
const CLIENT_ID = process.env.SIM_CLIENT || 'sharp_aircon';

// Pick reasonable defaults per archetype. Conservative — first-of-pool
// for variables, archetype's wired components for attachments.
function pickDefaults(arch, allComponents) {
  const v = arch.variable_inputs || {};
  const headlineKey = Object.keys(v).find((k) => k.toLowerCase().startsWith('headline'));
  const valueStackKey = ['Value stacks', 'Solution lines'].find((k) => v[k]);
  const picks = {
    headline:     headlineKey ? (v[headlineKey][0] || '') : '',
    sub_headline: (v['Sub-headlines'] && v['Sub-headlines'][0]) || '',
    value_stack:  valueStackKey ? (v[valueStackKey][0] || '') : '',
    cta:          (v['CTAs']  && v['CTAs'][0])  || '',
    badge:        (v['Badges'] && v['Badges'][0]) || '',
  };
  // Pick 4 components wired to this archetype (stay under 16 image attachments).
  const componentKeys = (allComponents || [])
    .filter((c) => Array.isArray(c.usedBy) && c.usedBy.includes(arch.code))
    .slice(0, 4)
    .map((c) => c.key);
  return { picks, component_keys: componentKeys };
}

async function fetchJson(path) {
  const r = await fetch(SERVER + path);
  if (!r.ok) throw new Error(`${path} → ${r.status}`);
  return await r.json();
}

async function generateOne(arch, components) {
  const { picks, component_keys } = pickDefaults(arch, components);
  const body = {
    archetype: arch.code,
    client_id: CLIENT_ID,
    picks,
    component_keys,
    quality: 'high',
    n_candidates: 3,
    skip_critique: false,
  };
  const t0 = Date.now();
  const r = await fetch(SERVER + '/api/generate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const errText = await r.text();
    throw new Error(`HTTP ${r.status}: ${errText.slice(0, 300)}`);
  }
  const result = await r.json();
  const elapsed = Math.round((Date.now() - t0) / 1000);
  return {
    archetype: arch.code,
    name: arch.name,
    ad_id: result.ad_id,
    image_url: result.image?.url,
    hd_urls: result.image?.hdUrls || {},
    upscale_method: result.image?.upscaleMethod,
    candidates: result.image?.candidateUrls?.length || 0,
    pick_index: result.image?.bestIndex,
    pick_reasoning: result.pickBest?.reasoning,
    cost_usd: result.totalCostUsd,
    elapsed_s: elapsed,
    picks_used: picks,
    components_used: component_keys,
  };
}

async function main() {
  console.log(`[sim] server: ${SERVER}, client: ${CLIENT_ID}`);
  const archetypes = await fetchJson('/api/archetypes');
  const components = await fetchJson('/api/components');
  console.log(`[sim] archetypes: ${archetypes.length}, components: ${components.length}`);

  // Skip A10 if the client has no team/owner/van photos
  const client = await fetchJson('/api/clients/' + CLIENT_ID).catch(() => null);
  const hasPhoto = client && (client.team_photos_uploaded || client.owner_photos_uploaded || client.van_photos_uploaded);

  const results = [];
  let totalCost = 0;
  for (const arch of archetypes) {
    if (arch.code === 'A10' && !hasPhoto) {
      console.log(`[sim] SKIP ${arch.code} — no client photos uploaded`);
      results.push({ archetype: arch.code, name: arch.name, skipped: true, reason: 'no client photos' });
      continue;
    }
    console.log(`\n[sim] ▶ ${arch.code} ${arch.name} …`);
    try {
      const r = await generateOne(arch, components);
      console.log(`[sim] ✓ ${arch.code} done in ${r.elapsed_s}s · $${r.cost_usd?.toFixed(3)} · upscale: ${r.upscale_method}`);
      console.log(`[sim]   image: ${r.image_url}`);
      console.log(`[sim]   pick: candidate ${r.pick_index} — ${(r.pick_reasoning || '').slice(0, 200)}`);
      results.push(r);
      totalCost += r.cost_usd || 0;
    } catch (e) {
      console.error(`[sim] ✗ ${arch.code} FAILED: ${e.message}`);
      results.push({ archetype: arch.code, name: arch.name, error: e.message });
    }
  }

  console.log(`\n[sim] DONE. Total cost: $${totalCost.toFixed(2)} across ${results.length} archetypes.`);

  // Write report
  const reportPath = 'data/_cache/simulation-report.json';
  await fs.mkdir('data/_cache', { recursive: true });
  await fs.writeFile(reportPath, JSON.stringify({
    at: new Date().toISOString(),
    total_cost_usd: totalCost,
    archetypes_run: results.length,
    archetypes_succeeded: results.filter((r) => r.image_url).length,
    archetypes_failed: results.filter((r) => r.error).length,
    archetypes_skipped: results.filter((r) => r.skipped).length,
    results,
  }, null, 2));
  console.log(`[sim] report saved: ${reportPath}`);
}

main().catch((e) => { console.error('[sim] FATAL:', e); process.exit(1); });
