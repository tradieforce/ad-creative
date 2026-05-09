// Map archetype code (A1, A10) <-> on-disk reference-ad folder slug
// (A1-energy-bill-hero, A10-local-trust). The folders already exist; this
// module is the single place that knows the mapping.

import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { ASSETS_DIR } from './paths.js';

let cache = null;

function build() {
  const dir = join(ASSETS_DIR, 'reference-ads');
  const codeToSlug = {};
  const slugToCode = {};
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    let isDir = false;
    try { isDir = statSync(full).isDirectory(); } catch { /* ignore */ }
    if (!isDir) continue;
    const m = entry.match(/^(A\d+)-/);
    if (!m) continue;
    codeToSlug[m[1]] = entry;
    slugToCode[entry] = m[1];
  }
  return { codeToSlug, slugToCode };
}

function ensure() {
  if (!cache) cache = build();
  return cache;
}

export function slugForCode(code) {
  return ensure().codeToSlug[code] || null;
}

export function codeForSlug(slug) {
  return ensure().slugToCode[slug] || null;
}

export function refresh() {
  cache = null;
}
