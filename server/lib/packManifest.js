// Layer 1 — Pack manifest engine.
//
// Given a client, decides:
//   - Which archetypes fire for this client (default: all 10 except A10
//     conditional on team/owner/van photo, A6 conditional on promo > 0)
//   - Which variable inputs (headline/sub/value/cta/badge) to pick per archetype
//   - Which components to attach per archetype
//   - Pack-balance: enforces HR06 (max one fixed-price ad per pack), funnel-
//     stage spread, brand-count spread
//
// Output: an array of /api/generate-ready input objects, one per ad in the pack.
// The UI then loops through them, calling /api/generate for each. Pack-aware
// state (which fixed-price slot is taken, which palettes already used) is
// computed up-front so each ad call is independent.

import { db } from './db.js';

// Deterministic RNG seeded with pack id so packs are reproducible.
function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t = (t + 0x6D2B79F5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
function seedFromString(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function pick(rng, arr) {
  if (!arr || arr.length === 0) return undefined;
  return arr[Math.floor(rng() * arr.length)];
}

// Find the first headline pool key (handles A1 'Headlines', A5 'Headlines (summer)' etc.)
function headlinePoolFor(arch) {
  const v = arch.variable_inputs || {};
  const keys = Object.keys(v).filter((k) => k.toLowerCase().startsWith('headline'));
  return keys[0] || null;
}

// Decide whether each archetype fires for this client + the picks/components.
export async function buildPackManifest({ client, packId = null, archetypeFilter = null }) {
  const id = packId || ('pack_' + Date.now().toString(36));
  const rng = mulberry32(seedFromString(id));

  const archetypes = await db.readDoc('archetypes');
  const components = await db.readDoc('components');

  const hasPhoto = !!(client.team_photos_uploaded || client.owner_photos_uploaded || client.van_photos_uploaded);
  const hasPromo = (client.current_promo_pct || 0) > 0;

  // Pack-balance state.
  let fixedPriceTaken = false;        // HR06: max one fixed-price ad per pack
  const palettesUsed = [];            // (placeholder for future palette tracking)

  const manifest = [];
  for (const arch of archetypes) {
    if (archetypeFilter && !archetypeFilter.includes(arch.code)) continue;

    // ── Gating per HR17 / archetype-specific rules ────────────────────────
    if (arch.code === 'A10' && !hasPhoto) continue;            // requires team/owner/van photo
    if (arch.code === 'A6' && !hasPromo) continue;             // skip if no current promo

    // ── Variable picks ────────────────────────────────────────────────────
    const v = arch.variable_inputs || {};
    const headlineKey = headlinePoolFor(arch);
    const valueStackKey = ['Value stacks', 'Solution lines'].find((k) => v[k]);
    const picks = {
      headline:     headlineKey ? pick(rng, v[headlineKey]) : '',
      sub_headline: pick(rng, v['Sub-headlines']) || '',
      value_stack:  valueStackKey ? pick(rng, v[valueStackKey]) : '',
      cta:          pick(rng, v['CTAs']) || '',
      badge:        pick(rng, v['Badges']) || '',
    };

    // ── Pack-balance: HR06 — max ONE fixed-price ad per pack ─────────────
    let priceTreatment = 'per_week';   // default
    if (arch.code === 'A4' || arch.code === 'A8') {
      // A4 + A8 are the fixed-price candidates. First one wins; others go per-week.
      if (!fixedPriceTaken) {
        priceTreatment = 'fixed';
        fixedPriceTaken = true;
      }
    }
    if (arch.code === 'A3') priceTreatment = 'no_price';   // premium

    // ── Components: pick all wired components for this archetype, capped at 4 ─
    const accessible = (components || []).filter((c) => Array.isArray(c.usedBy) && c.usedBy.includes(arch.code));
    // For now, take the first 4. Future: use rng to rotate across multiple-photo
    // pools (A2 family, A5 reaction, A9 holiday backdrops).
    const componentKeys = accessible.slice(0, 4).map((c) => c.key);

    manifest.push({
      // Identifiers
      pack_id: id,
      archetype: arch.code,
      archetype_name: arch.name,
      funnel_stage: arch.funnel_stage,
      // /api/generate inputs
      client_id: client.id,
      picks,
      component_keys: componentKeys,
      attach_client_photos: arch.code === 'A10' ? ['team-1.png'] : [],   // TODO: pick from list
      quality: 'high',
      n_candidates: 3,
      // Pack-balance metadata (informational; respected by master prompt rules)
      price_treatment: priceTreatment,
      pack_position: manifest.length + 1,
    });
  }

  return {
    pack_id: id,
    client_id: client.id,
    created_at: new Date().toISOString(),
    skipped: {
      A10: !hasPhoto ? 'no team/owner/van photo' : null,
      A6:  !hasPromo ? 'current_promo_pct = 0' : null,
    },
    pack_balance: {
      fixed_price_archetype: manifest.find((m) => m.price_treatment === 'fixed')?.archetype || null,
      total_ads: manifest.length,
      funnel_distribution: manifest.reduce((acc, m) => {
        acc[m.funnel_stage] = (acc[m.funnel_stage] || 0) + 1;
        return acc;
      }, {}),
    },
    entries: manifest,
  };
}
