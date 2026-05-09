// One-shot migration: applies db/schema.sql, imports all JSON files into
// Postgres, and uploads every binary asset under assets/ to Vercel Blob.
//
// Run from local with prod env vars in scope:
//
//   POSTGRES_URL=... BLOB_READ_WRITE_TOKEN=... node scripts/migrate-from-json.js
//
// Re-runnable. Existing rows are upserted; existing blobs are overwritten.
//
// After this runs successfully, the prod app will read from Postgres + Blob
// and the local JSON / asset files become legacy snapshots (kept around for
// disaster recovery; gitignored from new uploads).

import 'dotenv/config';
import { promises as fs } from 'node:fs';
import { join, extname, basename } from 'node:path';
import { ROOT, ASSETS_DIR, FILES } from '../server/lib/paths.js';

if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
  console.error('Need DATABASE_URL or POSTGRES_URL'); process.exit(1);
}

const HAS_BLOB = !!process.env.BLOB_READ_WRITE_TOKEN;

async function main() {
  // ── 1. Apply schema ──────────────────────────────────────────────────
  console.log('[migrate] applying schema…');
  const { default: pkg } = await import('pg');
  const pool = new pkg.Pool({ connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL, ssl: { rejectUnauthorized: false } });
  const schema = await fs.readFile(join(ROOT, 'db', 'schema.sql'), 'utf8');
  await pool.query(schema);
  console.log('[migrate] schema applied.');

  // ── 2. Import documents ──────────────────────────────────────────────
  const docs = [
    { key: 'archetypes',   path: FILES.archetypes },
    { key: 'global-rules', path: FILES.globalRules },
    { key: 'components',   path: FILES.components },
    { key: 'prices',       path: FILES.prices },
    { key: 'ads',          path: FILES.ads },
  ];
  for (const d of docs) {
    try {
      const text = await fs.readFile(d.path, 'utf8');
      const value = JSON.parse(text);
      await pool.query(
        'INSERT INTO documents (key, value, updated_at) VALUES ($1, $2, NOW()) ' +
        'ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, text = NULL, updated_at = NOW()',
        [d.key, JSON.stringify(value)]
      );
      console.log(`[migrate] document "${d.key}": imported (${Array.isArray(value) ? value.length + ' items' : 'object'})`);
    } catch (e) {
      console.warn(`[migrate] document "${d.key}": skipped (${e.message})`);
    }
  }

  // master-prompt.md (text)
  try {
    const text = await fs.readFile(FILES.masterPrompt, 'utf8');
    await pool.query(
      'INSERT INTO documents (key, text, updated_at) VALUES ($1, $2, NOW()) ' +
      'ON CONFLICT (key) DO UPDATE SET text = EXCLUDED.text, value = NULL, updated_at = NOW()',
      ['master-prompt', text]
    );
    console.log(`[migrate] document "master-prompt": imported (${text.length} chars)`);
  } catch (e) {
    console.warn('[migrate] master-prompt: skipped:', e.message);
  }

  // ── 3. Import clients ────────────────────────────────────────────────
  try {
    const files = await fs.readdir(FILES.clientsDir);
    for (const f of files) {
      if (!f.endsWith('.json')) continue;
      const data = JSON.parse(await fs.readFile(join(FILES.clientsDir, f), 'utf8'));
      const id = data.id || f.replace(/\.json$/, '');
      await pool.query(
        'INSERT INTO clients (id, data, updated_at) VALUES ($1, $2, NOW()) ' +
        'ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()',
        [id, JSON.stringify(data)]
      );
      console.log(`[migrate] client "${id}": imported`);
    }
  } catch (e) {
    console.warn('[migrate] clients dir not found, skipping');
  }

  // ── 4. Upload binary assets to Vercel Blob ──────────────────────────
  if (!HAS_BLOB) {
    console.log('[migrate] BLOB_READ_WRITE_TOKEN not set — skipping asset uploads.');
    console.log('[migrate] Set the token and re-run to push assets.');
    await pool.end();
    return;
  }

  console.log('[migrate] uploading assets to Vercel Blob…');
  const { put } = await import('@vercel/blob');
  let uploaded = 0, skipped = 0;
  const components = JSON.parse(await fs.readFile(FILES.components, 'utf8'));
  const componentsByPath = new Map(components.map((c) => [c.imagePath, c]));

  // Walk assets/ recursively.
  async function walk(dir, prefix) {
    let entries;
    try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const full = join(dir, e.name);
      const rel = prefix ? `${prefix}/${e.name}` : e.name;
      // Skip _originals, _archive, and dotfiles
      if (e.name.startsWith('.') || e.name === '_originals' || e.name === '_archive' || e.name === '_triage') continue;
      if (e.isDirectory()) await walk(full, rel);
      else if (/\.(png|jpe?g|webp)$/i.test(e.name)) {
        const buf = await fs.readFile(full);
        const ext = extname(e.name).slice(1).toLowerCase();
        const ct = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
        try {
          const result = await put(rel, buf, { access: 'public', contentType: ct, addRandomSuffix: false, allowOverwrite: true });
          // For components, update imagePath in DB to the full Blob URL.
          const oldUrlPath = '/assets/' + rel;
          const matching = componentsByPath.get(oldUrlPath);
          if (matching) {
            matching.imagePath = result.url;
          }
          uploaded++;
          if (uploaded % 10 === 0) console.log(`[migrate]  uploaded ${uploaded}…`);
        } catch (err) {
          console.warn(`[migrate]  upload failed ${rel}:`, err.message);
          skipped++;
        }
      }
    }
  }
  await walk(ASSETS_DIR, '');

  // Re-write components doc with updated Blob URLs.
  await pool.query(
    'UPDATE documents SET value = $1, updated_at = NOW() WHERE key = $2',
    [JSON.stringify(components), 'components']
  );
  console.log(`[migrate] uploaded ${uploaded} assets (${skipped} skipped); component imagePaths rewritten to Blob URLs`);

  await pool.end();
  console.log('[migrate] done.');
}

main().catch((e) => { console.error('[migrate] FAILED:', e); process.exit(1); });
