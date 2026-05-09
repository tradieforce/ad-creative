// Spend dashboard — aggregates costs from spend_log + ads.json.
// Shown as a small widget at the top of the Master AI Prompt page.

import { Router } from 'express';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { DATA_DIR } from '../lib/paths.js';
import { db } from '../lib/db.js';

export const spendRouter = Router();

async function readSpendLog() {
  if (db.mode === 'pg') {
    // Postgres path — query spend_log table directly.
    const { default: pkg } = await import('pg');
    const pool = new pkg.Pool({ connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL, ssl: { rejectUnauthorized: false } });
    const r = await pool.query("SELECT ad_id, stage, model, cost_usd, at FROM spend_log WHERE at > NOW() - INTERVAL '90 days' ORDER BY at DESC");
    pool.end();
    return r.rows.map((row) => ({ ad_id: row.ad_id, stage: row.stage, model: row.model, costUsd: parseFloat(row.cost_usd) || 0, at: row.at }));
  }
  // FS path — read JSONL.
  const path = join(DATA_DIR, '_cache', 'spend.jsonl');
  try {
    const text = await fs.readFile(path, 'utf8');
    return text.split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  } catch { return []; }
}

spendRouter.get('/', async (_req, res, next) => {
  try {
    const log = await readSpendLog();
    const ads = await db.listAds();

    const now = Date.now();
    const since24h = now - 24 * 60 * 60 * 1000;
    const since7d  = now - 7 * 24 * 60 * 60 * 1000;
    const since30d = now - 30 * 24 * 60 * 60 * 1000;

    const filtered = (cutoff) => log.filter((e) => new Date(e.at).getTime() > cutoff);
    const sum = (arr) => arr.reduce((s, e) => s + (e.costUsd || 0), 0);

    const log24h = filtered(since24h);
    const log7d = filtered(since7d);
    const log30d = filtered(since30d);

    // Per-archetype roll-up: lookup ad_id → archetype via ads list
    const adArch = new Map(ads.map((a) => [a.id, a.archetype]));
    const byArchetype = {};
    for (const e of log7d) {
      const a = adArch.get(e.ad_id) || 'unknown';
      byArchetype[a] = (byArchetype[a] || 0) + (e.costUsd || 0);
    }

    res.json({
      total_calls_logged: log.length,
      last_24h: { calls: log24h.length, usd: round(sum(log24h)) },
      last_7d:  { calls: log7d.length,  usd: round(sum(log7d)) },
      last_30d: { calls: log30d.length, usd: round(sum(log30d)) },
      by_archetype_7d: Object.fromEntries(Object.entries(byArchetype).map(([k, v]) => [k, round(v)])),
      total_ads: ads.length,
    });
  } catch (e) { next(e); }
});

function round(n) { return Math.round(n * 1000) / 1000; }
