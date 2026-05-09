# Handoff for Tech Guy

> **Read `00_START_HERE.md` first.** This document assumes Phase 1 + 2 (Claude Code phase) is complete: uploads work locally, all assets are in place, data is in `data/*.json`.

You're inheriting a working local admin tool. Your job is to turn it into a production system that connects real Claude + ChatGPT Image 2 APIs and runs hosted somewhere Bray can access from anywhere.

---

## What you're inheriting

A folder that contains:

- `ui/` — working frontend (HTML/CSS/JS by Claude Code, may be ready to port to your stack of choice)
- `server.js` (or similar) — local Node/Express server with upload + data routes
- `assets/` — all the actual images Bray uploaded (reference ads, components, brand logos, stock photos)
- `data/` — JSON files containing the configuration (archetypes, global rules, components, clients, etc.)
- `docs/` — extensive design and architecture documentation from the design phase

Everything is wired up except the actual AI calls. The mockup pretends to generate ads — your job is to make it actually generate them.

---

## Production scope

### 1. Database (replace `data/*.json`)

The local mockup uses JSON files for everything. Production needs a real database.

Recommended: **Postgres** (via Supabase, Neon, or self-hosted on Railway/Render).

Schemas to migrate (from `data/`):
- `archetypes` (10 rows, mostly static config but with editable fields)
- `global_rules` (17 rows, editable)
- `components` (~45+ rows after Bray uploads, editable + new ones added)
- `clients` (1 row per onboarded client)
- `client_assets` (per-client uploaded photos, FK to clients)
- `ads` (every generated ad, FK to client + archetype + ref_ad)
- `master_prompt` (single row table, the editable system prompt + version history)
- `prices` (per-city pricing, semi-static)

A starter schema is in `docs/07_BUILD_PLAN/database_schema.sql`. Use it as a starting point or replace it — your call. Note: the schema there was written against the older Layer 1 / Layer 2 / Layer 3 architecture; the simplified direction in `PRODUCT_DIRECTION.md` removes the layer terminology but the underlying tables (clients, archetypes, ads, components, etc.) are essentially the same.

### 2. Object storage (replace `assets/`)

Move every asset out of local `assets/` to **S3, R2, or Supabase Storage**.

Image categories:
- Reference ads (10, ~one per archetype, occasionally swapped)
- Components (~45+, rarely changed)
- Client uploaded photos (per-client, accumulates)
- Generated ad PNGs (every ad generated, accumulates fast)

Recommended approach: signed URLs for read access in the UI; server-side uploads from the admin tool.

### 3. Claude API integration (the heart of the system)

This is the part that matters most. Read `docs/00_START_HERE/THE_PROMPT_ENGINE.md` and `docs/00_START_HERE/INPUT_TO_SECTION_MAP.md` first. Those two docs are the spec for what Claude is supposed to do.

The Claude integration has two responsibilities:

**A. Compose the ChatGPT prompt for each archetype**

For each archetype that fires for a given client:
1. Build a context bundle: archetype config + global rules + components selected + client onboarding data + past ads at this postcode (for diversity)
2. Send that context + the system prompt (`data/master-prompt.md`) to Claude
3. Claude returns a ChatGPT-ready prompt (text)
4. Bundle the prompt with the assets (reference image, components, client photos) for ChatGPT Image 2

API: `POST https://api.anthropic.com/v1/messages` with `claude-opus-4-7` (best quality) or `claude-sonnet-4-6` (cheaper).

**B. Vision pass for A10 (Local Trust)**

For A10 specifically, before composing the prompt, send the client's uploaded team/trust photos to Claude with vision and ask it to extract:
- Dominant colours (will become the ad palette)
- Branded text visible in photos (must be preserved)
- Subject positions (informs headline placement)
- Negative space areas (where to overlay text)
- Lighting/mood

That structured output then drives the prompt composition for A10. The other 9 archetypes don't need this step.

The exact 7-section prompt template Claude follows is documented in `docs/00_START_HERE/THE_PROMPT_ENGINE.md` and `docs/00_START_HERE/INPUT_TO_SECTION_MAP.md`. The 8 worked examples in `docs/05_GOLD_STANDARDS/*.json` show what good output looks like.

### 4. ChatGPT Image 2 integration

Once Claude has emitted a prompt + asset bundle, send it to **ChatGPT Image 2** (OpenAI's latest image generation model).

API: OpenAI's image generation endpoint with the `chatgpt-image-2` model. The bundle includes:
- The composed prompt (text)
- IMAGE 1 = the locked reference ad for this archetype
- IMAGE 2/3/... = locked components + client photos

Output: 1080×1080 PNG (or 1080×1350 portrait for A9 holiday variant per HR10).

Handle:
- Rate limits / retries
- Failure modes (regenerate, save partial state)
- Cost tracking (gpt-image-2 is paid per image)

### 5. Diversity logic (geographic, deferred from Claude Code phase)

Bray's design decision (see `PRODUCT_DIRECTION.md`):

Diversity is **scoped by geography**, not per-client. Clients only operate within ~100km of their address. So:

- Two clients in non-overlapping postcodes can run identical ads (their audiences never see both)
- When generating a new ad, check past ads at this client's postcode + adjacent postcodes ONLY — not globally
- Across packs for the SAME client, rotate variable inputs to avoid repeating headlines/CTAs

The Master AI Prompt (`data/master-prompt.md`) should be updated to instruct Claude on this behaviour. Bray can do this himself in the editor — but if you're modifying the prompt programmatically, this rule needs to be added.

### 6. Onboarding flow → ad generation

When Bray fills out the onboarding form:

1. Create the client record
2. Save uploaded photos to object storage
3. Trigger ad pack generation:
   - For each archetype A1-A9: run Claude prompt composition → ChatGPT Image 2 → save PNG → save record
   - For A10: only if `team_photos_uploaded == true` → vision pass → Claude → ChatGPT Image 2 → save
4. All ads visible in client file + global ad database

Total time per pack: ~5-10 min depending on Claude + ChatGPT response times. Run async / background job — don't block the form submission.

### 7. Auth + hosting

- Auth: Bray + team only. Magic link / Google SSO via Clerk, Auth.js, or Supabase Auth.
- Hosting: Railway, Render, Vercel, or Fly.io are all fine. The admin is low-volume (a few users, hundreds of ads/month).

---

## Tech stack recommendations

This is "what would I do" not "what you must do" — pick what fits your skills.

| Layer | Recommended | Alternative |
|---|---|---|
| Frontend | Vanilla HTML/JS (already built) or migrate to React + Tailwind | Vue, Svelte |
| Backend | Node.js + Express or Hono | Python + FastAPI |
| Database | Postgres (Supabase or Neon) | PlanetScale (MySQL) |
| Object storage | Cloudflare R2 (cheaper than S3) | S3, Supabase Storage |
| Auth | Clerk or Supabase Auth | Auth.js |
| Hosting | Railway or Render | Vercel + separate API host, Fly.io |
| AI APIs | Anthropic Claude (`claude-opus-4-7`) + OpenAI ChatGPT Image 2 | — |
| Job queue | BullMQ (Redis) or pg-boss (Postgres) | Inngest, Trigger.dev |

The mockup is vanilla HTML/JS so it ports cleanly to anything. You can keep it as-is and just add a real backend, or rewrite the frontend in your preferred framework.

---

## Where to find what

| What | Where |
|---|---|
| The 7-section prompt template Claude follows | `docs/00_START_HERE/THE_PROMPT_ENGINE.md` |
| Concrete line-by-line worked example (A1 Brisbane) | `docs/00_START_HERE/WORKED_EXAMPLE_A1.md` |
| Every input field → which prompt section it lands in | `docs/00_START_HERE/INPUT_TO_SECTION_MAP.md` |
| The actual Master AI system prompt (editable) | `data/master-prompt.md` |
| 8 proven test prompts (training reference for tuning) | `docs/05_GOLD_STANDARDS/*.json` |
| Per-archetype config (reference ads, rules, pools, components) | `data/archetypes.json` |
| 17 hard rules | `data/global-rules.json` |
| Component library | `data/components.json` |
| Per-city pricing | `data/prices.json` |
| Original spec markdown (prose explanations) | `docs/03_SPEC/` |
| Database starter schema | `docs/07_BUILD_PLAN/database_schema.sql` |
| API specs | `docs/07_BUILD_PLAN/api_specs.md` |
| Tech stack recommendations | `docs/07_BUILD_PLAN/tech_stack.md` |
| Cost model | `docs/08_OPERATIONS/cost_model.md` |
| Visual workflow reference | the workflow diagram inside `ui/index.html` (Master AI Prompt section) |

---

## Critical things to get right

1. **The Master AI Prompt is the most important code in the system.** Don't bury it. It needs to be visible and editable in the admin UI (Bray will tune it). Version-history would be nice. Hot-swap without redeploy is essential.

2. **Diversity is geographic, not global.** When checking past ads, scope to postcode + adjacent. See `PRODUCT_DIRECTION.md`.

3. **A10 is the only conditional archetype.** All other archetypes always generate for every client. A10 only generates if team photos are uploaded. This is a backend boolean check, not an AI decision.

4. **Reference ads are uploaded once per archetype and rarely changed.** They're not generated per-ad. Same image attached every time that archetype generates.

5. **Components must come from the components library, never AI-generated.** This is HR02. Critical components (condensers, diagrams, ducting) attached as locked images on every generation.

6. **Australian English everywhere.** "Colour" not "color", "$" for AUD, no "0% interest" anywhere (use "interest-free finance").

7. **The 17 hard rules are non-negotiable.** They get inlined into every composed prompt automatically by Claude. Don't drop any.

---

## When Bray hands you this folder

You should be able to:

1. Open `ui/index.html` in a browser (or run `npm start` if Claude Code set up a dev server) and see the working admin
2. Open `data/master-prompt.md` and read the system prompt that drives Claude
3. Open `docs/00_START_HERE/THE_PROMPT_ENGINE.md` and understand the prompt-composition logic in 15 minutes
4. Run the existing local server, see uploads working
5. Pick your stack and start the production build

If anything's unclear, the design conversation that produced this is in claude.ai chat history — Bray can share it. But everything material should be in the docs.

Welcome to the project. Have fun.
