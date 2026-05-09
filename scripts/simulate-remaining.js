// Run sim for A2-A9 only (skip A1 — already iterated 4× and locked at 97%
// match; remaining gap is a model limitation not worth more compose-time spend
// to fight). Skip A10 (no client photos uploaded for sample client).

import 'dotenv/config';
import { promises as fs } from 'node:fs';

const SERVER = process.env.SIM_SERVER || 'http://localhost:3000';
const CLIENT_ID = 'sharp_aircon';
const ARCHETYPES_TO_RUN = ['A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9'];

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
  const t0 = Date.now();
  const r = await fetch(SERVER + '/api/generate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      archetype: arch.code, client_id: CLIENT_ID, picks, component_keys,
      quality: 'high', n_candidates: 3, skip_critique: false,
    }),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
  const result = await r.json();
  return {
    archetype: arch.code, name: arch.name,
    ad_id: result.ad_id,
    image_url: result.image?.url,
    hd_urls: result.image?.hdUrls || {},
    upscale_method: result.image?.upscaleMethod,
    cost_usd: result.totalCostUsd,
    elapsed_s: Math.round((Date.now() - t0) / 1000),
    picks_used: picks,
    components_used: component_keys,
  };
}

async function main() {
  console.log(`[sim-rest] starting at ${new Date().toISOString()} — running ${ARCHETYPES_TO_RUN.join(', ')}`);
  const archetypes = (await fetchJson('/api/archetypes')).filter((a) => ARCHETYPES_TO_RUN.includes(a.code));
  const components = await fetchJson('/api/components');

  const results = [];
  let totalCost = 0;
  for (const arch of archetypes) {
    console.log(`\n[sim-rest] ▶ ${arch.code} ${arch.name} …`);
    try {
      const r = await generateOne(arch, components);
      console.log(`[sim-rest] ✓ ${arch.code} ${r.elapsed_s}s · $${r.cost_usd?.toFixed(3)} · upscale: ${r.upscale_method}`);
      console.log(`[sim-rest]   image: ${r.image_url}`);
      results.push(r);
      totalCost += r.cost_usd || 0;
    } catch (e) {
      console.error(`[sim-rest] ✗ ${arch.code} FAILED: ${e.message}`);
      results.push({ archetype: arch.code, error: e.message });
    }
  }
  console.log(`\n[sim-rest] DONE. Total: $${totalCost.toFixed(2)} across ${results.length} archetypes.`);
  await fs.mkdir('data/_cache', { recursive: true });
  await fs.writeFile('data/_cache/simulation-rest-report.json', JSON.stringify({
    at: new Date().toISOString(), total_cost_usd: totalCost, results,
  }, null, 2));
  console.log('[sim-rest] report saved: data/_cache/simulation-rest-report.json');
}

main().catch((e) => { console.error('[sim-rest] FATAL:', e); process.exit(1); });
