-- Tradie Force Ad Creative Tool — Postgres schema
--
-- Apply once after provisioning Vercel Postgres:
--   psql "$POSTGRES_URL" -f db/schema.sql
-- OR run scripts/migrate-from-json.js which applies this then imports data.

-- Generic key/value store for the small "config" docs that the UI edits as
-- a whole (archetypes, global rules, components, prices, master prompt, ads
-- list). Either `value` (JSONB) or `text` (for master-prompt.md) is set.
CREATE TABLE IF NOT EXISTS documents (
  key         TEXT PRIMARY KEY,
  value       JSONB,
  text        TEXT,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- One row per onboarded client. Full client record stored as JSONB so we
-- can keep schema-flexible for now.
CREATE TABLE IF NOT EXISTS clients (
  id          TEXT PRIMARY KEY,
  data        JSONB NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS clients_business_idx ON clients ((data->>'business_name'));

-- Generated ads. Append-mostly. We keep a few hot columns for filtering +
-- the full record in `data`.
CREATE TABLE IF NOT EXISTS ads (
  id          TEXT PRIMARY KEY,
  archetype   TEXT,
  client_id   TEXT,
  city        TEXT,
  headline    TEXT,
  image_url   TEXT,
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ads_client_idx    ON ads (client_id);
CREATE INDEX IF NOT EXISTS ads_archetype_idx ON ads (archetype);
CREATE INDEX IF NOT EXISTS ads_created_idx   ON ads (created_at DESC);

-- Per-call spend log. JSON-line equivalent of data/_cache/spend.jsonl.
CREATE TABLE IF NOT EXISTS spend_log (
  id          BIGSERIAL PRIMARY KEY,
  ad_id       TEXT,
  stage       TEXT,
  model       TEXT,
  cost_usd    NUMERIC(10, 6),
  details     JSONB,
  at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS spend_at_idx ON spend_log (at DESC);
