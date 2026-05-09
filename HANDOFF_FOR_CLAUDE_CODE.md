# Handoff for Claude Code

> **Read `00_START_HERE.md` first.** This document assumes you've read that and understand the high-level structure.

You're being handed a working visual mockup (`ui/index.html`) plus a full folder structure ready to receive assets. Your job is to make uploads through the UI actually persist to disk, then help Bray populate the assets.

---

## Your job — in three phases

### Phase 1 — Make uploads persist to disk

The current `ui/index.html` is a self-contained mockup. When you click "Upload component image" or "Upload reference ad" it stores the image as a base64 data URI in browser memory. Refresh the page and it's gone.

You need to change that so uploads land in the `assets/` folder structure.

**Recommended approach: small Node/Express server.**

Why a small server (and not the File System Access API): the tech guy who comes after you will replace this with a production backend. A small Express server is the closest mockup of that backend — it's the same shape, just running locally instead of in the cloud. The tech guy can take the routes you build and port them straight into the production stack.

What the server needs to do:

```
POST /upload/reference-ad/:archetype-slug
  Body: multipart/form-data with image file
  Saves to: assets/reference-ads/{archetype-slug}/reference.png
  Updates: data/archetypes.json (add/update referencePath)

POST /upload/component
  Body: multipart with image + form fields (category, key, description)
  Saves image to: assets/components/{category-slug}/{key}.png
  Adds entry to: data/components.json

POST /upload/client-photo/:client-id/:photo-type
  photo-type ∈ {team, owner, van, lifestyle, reaction, bill-holder}
  Saves to: assets/client-uploads/{client-id}/{photo-type}-{n}.png

POST /clients
  Body: JSON form data
  Creates: data/clients/{client-id}.json
  Creates folder: assets/client-uploads/{client-id}/

GET /data/archetypes.json   ← serves current state
GET /data/global-rules.json
GET /data/components.json
GET /data/clients/:id
PATCH /data/archetypes/:code  ← edits an archetype's rules/pools
PATCH /data/global-rules/:hr-id ← edits a global rule
PATCH /data/components/:key ← edits a component
DELETE /... for delete endpoints
```

The current `ui/index.html` keeps all state in JavaScript memory. Your job is to make it call these endpoints instead — load data on startup, save changes back. You can either modify `ui/index.html` directly, or build `ui/app.js` that gets loaded by a slimmer `index.html`. Either works.

**Folder conventions (use these literally):**

```
assets/reference-ads/{archetype-slug}/reference.png
  Examples: A1-energy-bill-hero/reference.png, A10-local-trust/reference.png

assets/components/{category-slug}/{component-key}.png
  Examples: components/condensers/cond_daikin.png
            components/brand-logos/daikin.png
            components/house-diagrams/house_3d_blue.png
  Category slugs: condensers, house-diagrams, outlets, controllers, ducting,
                  stock-family, stock-reaction, brand-logos, trust-badges

assets/client-uploads/{client-id}/{photo-type}-{n}.png
  client-id is a slug like sharp-aircon, cool-breeze-brisbane
  photo-type ∈ {team, owner, van, lifestyle, reaction, bill-holder}
  Examples: client-uploads/sharp-aircon/team-1.png

assets/generated-ads/{client-id}/{ad-id}.png
  ad-id like ad_001, ad_002 etc
```

**Data conventions:**

When an upload lands, also update the relevant JSON in `data/`:
- New component → add entry to `data/components.json` with `imagePath: "/assets/components/{cat}/{key}.png"`
- Reference ad upload → update the matching archetype in `data/archetypes.json` with `referencePath`
- Client created → create `data/clients/{client-id}.json`

Keep all JSON pretty-printed (`indent=2`) so the files are diff-friendly.

### Phase 2 — Help Bray populate assets

Once Phase 1 works, walk Bray through the checklist in `ASSET_CHECKLIST.md`. He'll send you images (drag-drop, paste, attach) and you place them in the right folders — OR you can confirm the upload UI in `ui/index.html` works end-to-end and let him use that.

The checklist breaks into:

1. **Reference ads** — 10 archetypes need a locked reference image each. The package already includes the historical references from previous campaigns (in `assets/reference-ads/{archetype}/`). Bray may want to swap some.

2. **Components** — 45+ component records exist in `data/components.json` with placeholder image references. Real images need to be uploaded:
   - Condensers (5 records: neutral_1, neutral_2, daikin, mitsubishi, samsung)
   - House diagrams (~3-4 variants)
   - Outlets (~3-4 variants)
   - Controllers (~3-4 variants)
   - Ducting (~2-3 variants)
   - Stock family photos (~6-8)
   - Stock reaction photos (~6-8)
   - Brand logos (Daikin, MHI, Mitsubishi Electric, Samsung, Fujitsu, Hisense, Panasonic, LG, Toshiba)
   - Trust badges (Google reviews, etc)

3. **Client uploads** — these only happen when an actual client is onboarded. Skip until needed.

### Phase 3 — Quality pass before tech-guy handoff

Before handing the working folder to the tech guy:

- [ ] Confirm `ui/index.html` (or its split version) loads data from `data/*.json` instead of having it embedded
- [ ] Confirm uploads through the UI persist to `assets/` and update `data/`
- [ ] Confirm the live prompt simulator on each archetype detail page still works
- [ ] Confirm A10's photo-conditional behaviour still works (no team photos = A10 doesn't fire)
- [ ] Confirm the Master AI Prompt editor saves changes to `data/master-prompt.md`
- [ ] Smoke test: create a new client through the onboarding form, verify a folder appears in `assets/client-uploads/{client-id}/`, verify a file appears in `data/clients/{client-id}.json`
- [ ] Smoke test: upload a new component, verify the image is in `assets/components/{cat}/{key}.png` and the entry is in `data/components.json` with the right `imagePath`

Then the tech guy can take it from here.

---

## Things NOT in your scope

Leave these for the tech guy. Don't try to do them now:

- ❌ Real Claude API integration (the actual prompt composition)
- ❌ Real ChatGPT Image 2 integration (the actual image generation)
- ❌ Production database (Postgres / Supabase / etc)
- ❌ Production object storage (S3 / R2 for images)
- ❌ Authentication / login
- ❌ Production deployment / hosting
- ❌ Cron / scheduling for ad packs

Your goal is "Bray can use the tool to configure everything and upload all the assets, running locally on his machine." The tech guy connects it to the real APIs and ships it.

---

## Suggested project structure (after your work)

After Phase 1 you'll likely have something like:

```
tradie-force-admin/
├── package.json                ← Node deps for the local server
├── server.js                   ← Express server (uploads, data routes)
├── ui/
│   ├── index.html              ← stripped down (no embedded data)
│   ├── app.js                  ← all the JS that was inline before
│   └── styles.css              ← all the CSS that was inline before
├── assets/                     ← (unchanged from initial structure)
├── data/                       ← (unchanged structure, files mutate)
└── docs/                       ← (unchanged, reference material)
```

The split is optional but makes the tech guy's job easier — they can take `app.js` and port it to React/Vue/whatever they're using, without untangling embedded data and inline scripts.

---

## Things to look at in the existing mockup before you start

Before you change anything, open `ui/index.html` in a browser and click around all 6 sidebar sections. The mockup is the design spec — the production version should look and behave the same, just with real persistence.

Specifically, study:

- **Archetypes section → click into A1** — see the full anatomy of an archetype detail page: reference ad block, archetype-specific rules (editable), variable input pools (editable), component picker (selectable), live prompt preview (rebuilds when dropdowns change), gold standard.
- **Components section** — see the category sidebar + component cards. Click "+ Upload new component" to see the upload modal that needs to actually persist now.
- **Clients section → click "+ New client"** — see the onboarding form. It currently does nothing on submit.
- **Clients section → click "Sharp Air Conditioning"** — see the per-client view with the paired ad cards (output + prompt + reference image grouped together).
- **Ad Database** — see the global ad grid with filters.
- **Master AI Prompt** — see the workflow diagram (the visual map of Claude's role) and the editable system prompt below.

The data underneath all of this is in `data/`. The mockup currently embeds it; your job is to read it from disk.

---

## Helpful references

When in doubt, the design intent is captured in (in priority order):

- **`docs/00_START_HERE/THE_PROMPT_ENGINE.md`** — how Master AI composes a ChatGPT prompt (5 inputs + 7-section template)
- **`docs/00_START_HERE/INPUT_TO_SECTION_MAP.md`** — table of every input field and where it lands in the prompt
- **`docs/00_START_HERE/WORKED_EXAMPLE_A1.md`** — concrete line-by-line trace of one prompt being composed (most useful single artefact for understanding the system)
- **`docs/00_START_HERE/THE_METHOD.md`** — higher-altitude 6-step recipe
- **`docs/05_GOLD_STANDARDS/*.json`** — 8 proven test prompts (each one shows what a working ChatGPT prompt looks like for that archetype)
- **`data/master-prompt.md`** — the actual Master AI system prompt that drives Claude (editable)
- **`PRODUCT_DIRECTION.md`** — Bray's plain-English direction (the most current and authoritative)

If `PRODUCT_DIRECTION.md` and any older `docs/` content disagree, **follow `PRODUCT_DIRECTION.md`** — it's the latest decision. Some older docs in `docs/03_SPEC/` reflect earlier "Layer 1 / Layer 2 / Layer 3" thinking that has been simplified — wherever you see "Layer 2" in older docs, mentally substitute "Master AI" (it's the same thing).
