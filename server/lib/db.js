// Database abstraction — JSON files in dev, Postgres in prod.
//
// Toggle via DATABASE_URL env:
//   DATABASE_URL unset → JSON files under data/ (current behaviour)
//   DATABASE_URL set   → Postgres (Vercel Postgres / Neon / any Postgres URL)
//
// Two interfaces:
//   1. document store (kv-like)  — for the small shared docs (archetypes, global rules,
//      components, prices, master-prompt) where we want one logical document.
//      readDoc(key) / writeDoc(key, value) / patchDoc(key, mutator)
//
//   2. clients store              — one row per client, keyed by client id.
//      listClients() / readClient(id) / writeClient(id, value) / deleteClient(id)
//
//   3. ads + spend_log            — append-mostly tables.
//      listAds() / appendAd(record) / appendSpend(entry)
//
// Doc keys (matching current JSON file names):
//   "archetypes", "global-rules", "components", "prices", "master-prompt", "ads"

import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { DATA_DIR, FILES } from './paths.js';
import { readJSON, writeJSON, patchJSON, readText, writeText } from './store.js';

// (DATA_DIR also referenced inside pathFor for dynamic keys)

const HAS_PG = !!process.env.DATABASE_URL || !!process.env.POSTGRES_URL;

// ── JSON-FILE BACKEND (dev) ───────────────────────────────────────────────
const fileBackend = {
  mode: 'fs',

  async readDoc(key) {
    if (key === 'master-prompt') return await readText(FILES.masterPrompt, '');
    const path = pathFor(key);
    return await readJSON(path, defaultFor(key));
  },
  async writeDoc(key, value) {
    if (key === 'master-prompt') return await writeText(FILES.masterPrompt, value);
    const path = pathFor(key);
    return await writeJSON(path, value);
  },
  async patchDoc(key, mutator) {
    if (key === 'master-prompt') {
      const cur = await readText(FILES.masterPrompt, '');
      const next = await mutator(cur);
      await writeText(FILES.masterPrompt, next === undefined ? cur : next);
      return;
    }
    const path = pathFor(key);
    return await patchJSON(path, mutator, defaultFor(key));
  },

  async listClients() {
    try {
      const files = await fs.readdir(FILES.clientsDir);
      const out = [];
      for (const f of files) {
        if (!f.endsWith('.json')) continue;
        try { out.push(await readJSON(join(FILES.clientsDir, f))); } catch { /* skip */ }
      }
      return out;
    } catch (e) { if (e.code === 'ENOENT') return []; throw e; }
  },
  async readClient(id) {
    return await readJSON(join(FILES.clientsDir, id + '.json'));
  },
  async writeClient(id, value) {
    return await writeJSON(join(FILES.clientsDir, id + '.json'), value);
  },
  async deleteClient(id) {
    await fs.unlink(join(FILES.clientsDir, id + '.json')).catch(() => {});
  },
  async patchClient(id, mutator) {
    return await patchJSON(join(FILES.clientsDir, id + '.json'), mutator);
  },

  async listAds() { return await readJSON(FILES.ads, []); },
  async appendAd(record) {
    return await patchJSON(FILES.ads, (list) => {
      const arr = Array.isArray(list) ? list : [];
      arr.unshift(record);
      return arr;
    }, []);
  },
  async patchAd(id, mutator) {
    return await patchJSON(FILES.ads, async (list) => {
      const arr = Array.isArray(list) ? list : [];
      const i = arr.findIndex((a) => a.id === id);
      if (i >= 0) arr[i] = (await mutator(arr[i])) ?? arr[i];
      return arr;
    }, []);
  },

  async appendSpend(entry) {
    const path = join(DATA_DIR, '_cache', 'spend.jsonl');
    await fs.mkdir(join(DATA_DIR, '_cache'), { recursive: true });
    await fs.appendFile(path, JSON.stringify(entry) + '\n');
  },
};

// ── POSTGRES BACKEND (prod) ──────────────────────────────────────────────
let _pg = null;
async function pg() {
  if (_pg) return _pg;
  // Use node-postgres directly so this works against any Postgres (Vercel /
  // Neon / Railway / self-hosted), not just Vercel Postgres.
  const { default: pkg } = await import('pg');
  const { Pool } = pkg;
  _pg = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false },   // Neon / Vercel Postgres want this
    max: 5,
    idleTimeoutMillis: 30000,
  });
  return _pg;
}

const pgBackend = {
  mode: 'pg',

  async readDoc(key) {
    const p = await pg();
    const r = await p.query('SELECT value, text FROM documents WHERE key = $1', [key]);
    if (r.rows.length === 0) return defaultFor(key);
    const row = r.rows[0];
    return row.text != null ? row.text : row.value;
  },
  async writeDoc(key, value) {
    const p = await pg();
    if (typeof value === 'string') {
      await p.query(
        'INSERT INTO documents (key, text, updated_at) VALUES ($1, $2, NOW()) ' +
        'ON CONFLICT (key) DO UPDATE SET text = EXCLUDED.text, value = NULL, updated_at = NOW()',
        [key, value]
      );
    } else {
      await p.query(
        'INSERT INTO documents (key, value, updated_at) VALUES ($1, $2, NOW()) ' +
        'ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, text = NULL, updated_at = NOW()',
        [key, JSON.stringify(value)]
      );
    }
  },
  async patchDoc(key, mutator) {
    const cur = await this.readDoc(key);
    const next = await mutator(cur);
    await this.writeDoc(key, next === undefined ? cur : next);
  },

  async listClients() {
    const p = await pg();
    const r = await p.query('SELECT data FROM clients ORDER BY (data->>\'business_name\')');
    return r.rows.map((row) => row.data);
  },
  async readClient(id) {
    const p = await pg();
    const r = await p.query('SELECT data FROM clients WHERE id = $1', [id]);
    if (r.rows.length === 0) { const e = new Error('not found'); e.code = 'ENOENT'; throw e; }
    return r.rows[0].data;
  },
  async writeClient(id, value) {
    const p = await pg();
    await p.query(
      'INSERT INTO clients (id, data, updated_at) VALUES ($1, $2, NOW()) ' +
      'ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()',
      [id, JSON.stringify(value)]
    );
  },
  async deleteClient(id) {
    const p = await pg();
    await p.query('DELETE FROM clients WHERE id = $1', [id]);
  },
  async patchClient(id, mutator) {
    const cur = await this.readClient(id).catch(() => null);
    const next = await mutator(cur || {});
    await this.writeClient(id, next === undefined ? cur : next);
  },

  async listAds() {
    const p = await pg();
    const r = await p.query('SELECT data FROM ads ORDER BY created_at DESC LIMIT 1000');
    return r.rows.map((row) => row.data);
  },
  async appendAd(record) {
    const p = await pg();
    await p.query(
      'INSERT INTO ads (id, archetype, client_id, city, headline, image_url, data, created_at) ' +
      'VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())',
      [record.id, record.archetype, record.client_id, record.city, record.headline, record.image_url, JSON.stringify(record)]
    );
  },
  async patchAd(id, mutator) {
    const p = await pg();
    const r = await p.query('SELECT data FROM ads WHERE id = $1', [id]);
    if (r.rows.length === 0) return;
    const next = (await mutator(r.rows[0].data)) ?? r.rows[0].data;
    await p.query('UPDATE ads SET data = $1, image_url = $2 WHERE id = $3', [JSON.stringify(next), next.image_url, id]);
  },

  async appendSpend(entry) {
    const p = await pg();
    await p.query(
      'INSERT INTO spend_log (ad_id, stage, model, cost_usd, details, at) ' +
      'VALUES ($1, $2, $3, $4, $5, NOW())',
      [entry.ad_id || null, entry.stage || null, entry.model || null, entry.costUsd || null, JSON.stringify(entry)]
    );
  },
};

// ── ROUTING ──────────────────────────────────────────────────────────────
function pathFor(key) {
  switch (key) {
    case 'archetypes':    return FILES.archetypes;
    case 'global-rules':  return FILES.globalRules;
    case 'components':    return FILES.components;
    case 'prices':        return FILES.prices;
    case 'ads':           return FILES.ads;
    default:
      // Dynamic keys (packs, custom config, etc.) — store under data/<key>.json
      return join(DATA_DIR, key.replace(/[^a-z0-9_-]/gi, '_') + '.json');
  }
}
function defaultFor(key) {
  if (key === 'master-prompt') return '';
  if (key.startsWith('pack_')) return null;       // packs are objects
  return [];   // every other top-level doc is an array
}

export const db = HAS_PG ? pgBackend : fileBackend;
export const DB_MODE = db.mode;
