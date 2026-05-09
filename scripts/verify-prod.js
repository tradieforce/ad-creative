// Post-deploy verification — runs after you've provisioned Postgres + Blob
// in Vercel and pulled prod env locally.
//
// Usage:
//   npx vercel env pull .env.production.local
//   node --env-file=.env.production.local scripts/verify-prod.js
//
// What it checks:
//   1. All required env vars present
//   2. Postgres reachable + schema applied
//   3. Blob reachable
//   4. Live URL hits return 200 (after Deployment Protection is off)
//   5. /api/spend endpoint returns reasonable shape

const REQUIRED_ENV = [
  'ANTHROPIC_API_KEY',
  'OPENAI_API_KEY',
  'REPLICATE_API_TOKEN',
  'OPENAI_IMAGE_MODEL',
  'ANTHROPIC_MODEL',
  'ADMIN_PASSWORD',
  'SESSION_SECRET',
  'DATABASE_URL',
  'POSTGRES_URL',
  'BLOB_READ_WRITE_TOKEN',
];

const PROD_URL = process.env.PROD_URL || 'https://tradieforce.com';

let pass = 0, fail = 0;
function ok(label) { console.log(`✓ ${label}`); pass++; }
function bad(label, detail = '') { console.log(`✗ ${label}${detail ? ' — ' + detail : ''}`); fail++; }

async function main() {
  console.log('=== 1. Env vars ===');
  for (const k of REQUIRED_ENV) {
    if (process.env[k]) ok(k);
    else bad(k, 'not set in .env.production.local');
  }

  console.log('\n=== 2. Postgres ===');
  try {
    const { default: pkg } = await import('pg');
    const pool = new pkg.Pool({ connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL, ssl: { rejectUnauthorized: false } });
    const r = await pool.query('SELECT now() as t, current_database() as db');
    ok(`reachable: ${r.rows[0].db} at ${r.rows[0].t}`);
    const tables = await pool.query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename");
    if (tables.rows.length === 0) {
      bad('schema not applied', 'run scripts/migrate-from-json.js');
    } else {
      ok(`tables: ${tables.rows.map((r) => r.tablename).join(', ')}`);
      for (const tbl of ['documents', 'clients', 'ads', 'spend_log']) {
        const c = await pool.query(`SELECT count(*) FROM ${tbl}`);
        ok(`${tbl}: ${c.rows[0].count} rows`);
      }
    }
    await pool.end();
  } catch (e) { bad('postgres connect', e.message); }

  console.log('\n=== 3. Vercel Blob ===');
  try {
    const { list } = await import('@vercel/blob');
    const page = await list({ limit: 5 });
    ok(`blob list: ${page.blobs.length} blobs (showing 5 max)`);
  } catch (e) { bad('blob list', e.message); }

  console.log(`\n=== 4. Live URL ${PROD_URL} ===`);
  try {
    const r = await fetch(PROD_URL + '/api/health');
    if (r.status === 200) {
      const j = await r.json();
      ok(`health OK: ${j.at}`);
    } else if (r.status === 401) {
      bad('health 401', 'Vercel Deployment Protection still on — disable in Settings');
    } else {
      bad(`health ${r.status}`);
    }
  } catch (e) { bad('health fetch', e.message); }

  try {
    const r = await fetch(PROD_URL + '/api/spend');
    if (r.status === 200) {
      const s = await r.json();
      ok(`spend reachable: total ${s.total_calls_logged || 0} calls logged, ${s.total_ads || 0} ads`);
    } else { bad(`spend ${r.status}`); }
  } catch (e) { bad('spend fetch', e.message); }

  console.log(`\n${pass} passed, ${fail} failed.`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => { console.error('FATAL:', e); process.exit(2); });
