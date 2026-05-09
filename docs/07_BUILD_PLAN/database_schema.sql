-- Tradie Force Ad System — Postgres schema
-- Targets Postgres 14+. Adjust types if using a different DB.

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- CLIENTS
-- =============================================================================
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name TEXT NOT NULL,
    city TEXT NOT NULL,
    region TEXT,
    google_review_count INT DEFAULT 0,
    has_team_photo BOOLEAN DEFAULT FALSE,
    has_owner_photo BOOLEAN DEFAULT FALSE,
    has_van_photo BOOLEAN DEFAULT FALSE,
    brands_installed TEXT[] DEFAULT ARRAY[]::TEXT[],
    default_promo_pct INT DEFAULT 0 CHECK (default_promo_pct BETWEEN 0 AND 100),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_clients_city ON clients(city);

-- =============================================================================
-- ASSETS — locked components, stock library, client uploads, generated outputs
-- =============================================================================
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN (
        'locked_component',
        'stock',
        'client_upload',
        'generated_output',
        'reference_exemplar'
    )),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,  -- nullable; only for client_upload
    name TEXT NOT NULL,           -- e.g. "MHI double-fan ducted condenser"
    category TEXT,                -- e.g. "Condenser", "House diagram"
    s3_url TEXT NOT NULL,
    s3_key TEXT NOT NULL,
    width_px INT,
    height_px INT,
    file_size_bytes INT,
    metadata JSONB DEFAULT '{}'::jsonb,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_assets_type_category ON assets(type, category);
CREATE INDEX idx_assets_client_id ON assets(client_id);
CREATE INDEX idx_assets_name ON assets(name);

-- =============================================================================
-- PACKS — one per pack generation
-- =============================================================================
CREATE TABLE packs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'generating' CHECK (status IN (
        'generating',  -- L1 done, L2/L3 in progress
        'review',      -- all ads rendered, awaiting human review
        'approved',    -- all ads decided (approved or rejected)
        'exported',    -- approved set exported to zip
        'failed'       -- pack generation failed catastrophically
    )),
    total_ad_count INT NOT NULL DEFAULT 0,
    manifest_json JSONB NOT NULL,            -- the full L1 manifest
    fixed_price_eligible TEXT[] DEFAULT ARRAY[]::TEXT[],  -- e.g. ['A4.fixed_price_pain', 'A7.fixed_price']
    fixed_price_awarded TEXT,                -- which one Layer 2 picked
    total_cost_usd NUMERIC(10, 4) DEFAULT 0,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    review_started_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    exported_at TIMESTAMPTZ
);

CREATE INDEX idx_packs_client_id ON packs(client_id);
CREATE INDEX idx_packs_status ON packs(status);

-- =============================================================================
-- ADS — one per ad in a pack
-- =============================================================================
CREATE TABLE ads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pack_id UUID NOT NULL REFERENCES packs(id) ON DELETE CASCADE,
    archetype_code TEXT NOT NULL,            -- e.g. 'A4'
    variant_key TEXT,                         -- e.g. 'wallet'
    funnel_stage TEXT NOT NULL CHECK (funnel_stage IN ('cold_warm', 'warm_hot', 'hot')),
    pricing_mode TEXT NOT NULL CHECK (pricing_mode IN (
        'per_week', 'fixed_price', 'no_price', 'to_be_decided_by_l2'
    )),
    output_dimensions TEXT NOT NULL DEFAULT '1024x1024',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending',      -- L1 done, awaiting L2
        'composing',    -- L2 in progress
        'composed',     -- L2 done, awaiting L3
        'rendering',    -- L3 in progress
        'rendered',     -- L3 done, awaiting review
        'approved',
        'rejected'
    )),
    -- Variable inputs picked by L1
    selected_headline TEXT,
    selected_cta TEXT,
    selected_badge TEXT,
    value_stack TEXT[] DEFAULT ARRAY[]::TEXT[],
    -- Components (resolved S3 URLs)
    components_required JSONB DEFAULT '[]'::jsonb,
    -- Layer 2 output
    l2_prompt_used TEXT,
    l2_reasoning_trace TEXT,
    l2_pricing_decision TEXT,
    -- Layer 3 output
    l3_image_url TEXT,
    -- Counters
    regeneration_count INT NOT NULL DEFAULT 0,
    recomposition_count INT NOT NULL DEFAULT 0,
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ads_pack_id ON ads(pack_id);
CREATE INDEX idx_ads_status ON ads(status);
CREATE INDEX idx_ads_archetype ON ads(archetype_code);

-- =============================================================================
-- GENERATION JOBS — one per L2 or L3 attempt per ad
-- =============================================================================
CREATE TABLE generation_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
    layer TEXT NOT NULL CHECK (layer IN ('L1', 'L2', 'L3')),
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN (
        'queued', 'running', 'succeeded', 'failed'
    )),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    latency_ms INT,
    cost_usd NUMERIC(10, 4),
    model_used TEXT,
    input_tokens INT,
    output_tokens INT,
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_jobs_ad_id_layer ON generation_jobs(ad_id, layer, created_at DESC);
CREATE INDEX idx_jobs_status ON generation_jobs(status);

-- =============================================================================
-- REVIEW ACTIONS — audit log of operator decisions
-- =============================================================================
CREATE TABLE review_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
    user_id UUID,                             -- nullable for now (single-user system)
    action TEXT NOT NULL CHECK (action IN (
        'approve', 'reject', 'regenerate', 'recompose', 'edit_prompt'
    )),
    reason TEXT,
    edited_prompt TEXT,                       -- only for 'edit_prompt' action
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_review_actions_ad_id ON review_actions(ad_id);

-- =============================================================================
-- OPTIONAL: USERS (for multi-operator)
-- =============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    role TEXT NOT NULL DEFAULT 'operator' CHECK (role IN ('admin', 'operator', 'viewer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- TRIGGERS — keep updated_at fresh
-- =============================================================================
CREATE OR REPLACE FUNCTION trigger_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION trigger_updated_at();

CREATE TRIGGER ads_updated_at BEFORE UPDATE ON ads
    FOR EACH ROW EXECUTE FUNCTION trigger_updated_at();
