// Vercel Cron entry points. Vercel hits these on a schedule defined in
// vercel.json. They run as normal Vercel functions (max 800s on Pro).
//
// Auth: Vercel Cron sends a header `Authorization: Bearer <CRON_SECRET>`
// matching the env var `CRON_SECRET`. We accept any request when the env is
// unset (local dev) so you can hit `/api/cron/backup` from your terminal.

import { Router } from 'express';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { db } from '../lib/db.js';
import { storage } from '../lib/storage.js';

export const cronRouter = Router();

const execp = promisify(exec);

function authOk(req) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return true;   // dev convenience
  const auth = req.headers.authorization || '';
  return auth === `Bearer ${expected}`;
}

// Nightly Postgres dump → Blob. 8-week rotation.
//   GET /api/cron/backup
cronRouter.get('/backup', async (req, res, next) => {
  if (!authOk(req)) return res.status(401).json({ error: 'unauthorized' });
  try {
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!url) {
      // Local dev — back up data/ as a tarball instead.
      const { stdout } = await execp(`tar -cz -C data .`);
      const buf = Buffer.from(stdout, 'binary');
      const { url: blobUrl } = await storage.put(`backups/data-${ts}.tar.gz`, buf, 'application/gzip');
      return res.json({ ok: true, mode: 'fs-tarball', url: blobUrl });
    }
    // Postgres path: pg_dump → upload. We pipe via shell so we don't buffer in JS.
    const { stdout } = await execp(`pg_dump --no-owner --no-acl "${url}"`, { maxBuffer: 1024 * 1024 * 200 });
    const { url: blobUrl } = await storage.put(`backups/pgdump-${ts}.sql`, Buffer.from(stdout), 'application/sql');
    res.json({ ok: true, mode: 'pgdump', url: blobUrl });
  } catch (e) { next(e); }
});

// Cost report — aggregate spend log for the last 24h.
//   GET /api/cron/cost-report
cronRouter.get('/cost-report', async (req, res, next) => {
  if (!authOk(req)) return res.status(401).json({ error: 'unauthorized' });
  try {
    const ads = await db.listAds();
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const recent = ads.filter((a) => new Date(a.created || 0).getTime() > cutoff);
    const total = recent.reduce((sum, a) => sum + (a.total_cost_usd || 0), 0);
    res.json({ ok: true, last_24h: { ads: recent.length, total_usd: total } });
  } catch (e) { next(e); }
});
