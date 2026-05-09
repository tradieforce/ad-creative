# Tradie Force Admin Tool — Handoff Package

**What this is:** Internal admin tool for generating ducted A/C ads for residential installer clients across Australia. Owned by Bray (Tradie Force). Not customer-facing — only Bray and team use it.

**Where you are in the journey:**

```
[ Conversation in Claude.ai ]   →   [ HANDOFF (THIS FOLDER) ]   →   [ Claude Code phase ]   →   [ Tech-guy / production phase ]
   architecture + mockup           ← you are here →            wire uploads to disk         connect APIs, ship
   designed and tested              + populate assets           help Bray populate           Claude API + ChatGPT
                                                                                            Image 2 + database
```

---

## Read these in order

1. **`HANDOFF_FOR_CLAUDE_CODE.md`** — this is the next step. Opens the package in Claude Code, makes uploads persist to disk, helps Bray populate `assets/`. Read this first if you're Claude Code.

2. **`HANDOFF_FOR_TECH_GUY.md`** — the phase after Claude Code. Connect Claude API + ChatGPT Image 2, replace local server with production stack. Read this if you're the developer who comes after Claude Code.

3. **`ASSET_CHECKLIST.md`** — what images need to be uploaded. Reference ads, components, brand logos, stock photos. Bray works through this list with Claude Code.

4. **`PRODUCT_DIRECTION.md`** — Bray's own direction document. Plain-English description of what the software is and is not. Reflects the latest decisions.

5. **`ui/index.html`** — the working visual mockup. Open it in a browser to see the full product. Self-contained single HTML file with all 6 main sections (Archetypes, Global Rules, Components, Clients, Ad Database, Master AI Prompt) functional.

6. **`docs/`** — focused reference material from the design phase. The most important files inside `docs/` are:
   - `docs/00_START_HERE/THE_PROMPT_ENGINE.md` — the reverse-engineered explanation of how Master AI composes a ChatGPT prompt. The crown jewel.
   - `docs/00_START_HERE/INPUT_TO_SECTION_MAP.md` — implementation table mapping every input field to where it lands in the composed prompt.
   - `docs/00_START_HERE/WORKED_EXAMPLE_A1.md` — concrete line-by-line trace of one prompt being composed (A1 Energy Bill Hero, Brisbane). Most useful single artefact for understanding the system.
   - `docs/00_START_HERE/THE_METHOD.md` — the higher-level 6-step recipe.
   - `docs/05_GOLD_STANDARDS/*.json` — 8 production-tested archetype prompts proven to produce good ads in ChatGPT.
   - `docs/03_SPEC/` — original spec markdown files with prose explanations.

7. **`data/master-prompt.md`** — the actual Master AI system prompt (~24KB). Editable in the UI. This is the system prompt that drives Master AI on every generation.

---

## Folder structure at a glance

```
tradie-force-admin/
├── 00_START_HERE.md                    ← you are reading this
├── HANDOFF_FOR_CLAUDE_CODE.md          ← read next if you're Claude Code
├── HANDOFF_FOR_TECH_GUY.md             ← read after Claude Code phase
├── ASSET_CHECKLIST.md                  ← what needs to be uploaded
├── PRODUCT_DIRECTION.md                ← Bray's plain-English direction
│
├── ui/
│   └── index.html                      ← the visual mockup (self-contained)
│
├── assets/                             ← where uploads go
│   ├── reference-ads/                  ← 10 per-archetype reference ads (pre-populated)
│   ├── components/                     ← 9 category folders, empty (awaiting uploads)
│   ├── client-uploads/                 ← per-client photos (empty until clients onboard)
│   └── generated-ads/                  ← final ChatGPT outputs (empty until generation runs)
│
├── data/                               ← extracted/derived configuration
│   ├── archetypes.json                 ← all 10 archetype configs
│   ├── global-rules.json               ← 17 hard rules
│   ├── components.json                 ← components library (records, not images)
│   ├── prices.json                     ← per-city pricing
│   └── master-prompt.md                ← THE Master AI system prompt (editable in UI)
│
└── docs/                               ← focused reference material
    ├── 00_START_HERE/
    │   ├── THE_PROMPT_ENGINE.md        ← how Master AI composes prompts
    │   ├── INPUT_TO_SECTION_MAP.md     ← input → prompt section mapping
    │   ├── WORKED_EXAMPLE_A1.md        ← concrete line-by-line trace (A1 Brisbane)
    │   ├── THE_METHOD.md               ← higher-level 6-step recipe
    │   ├── EXECUTIVE_SUMMARY.md
    │   └── README.md
    ├── 03_SPEC/                        ← original spec files (prose + tradie_force_spec.json)
    ├── 05_GOLD_STANDARDS/              ← 8 proven test prompts
    ├── 07_BUILD_PLAN/                  ← database_schema.sql, api_specs.md, tech_stack.md
    └── 08_OPERATIONS/                  ← cost_model.md
```

---

## The system in one paragraph

Bray onboards a client by filling out an internal form (city, postcode, brands, photos, etc.). The system has 10 ad archetypes (energy bill hero, speed guarantee, luxury, problem/solution, seasonal pain, seasonal sale, city massive sale, localised clearance, holiday event, local trust). For each archetype, there's a locked reference ad, a set of rules, pools of variable inputs (headlines, CTAs, value stacks, badges), and selected components. Claude (Master AI) composes a ChatGPT prompt by reading: the onboarding data + global rules + archetype config + components + past ads. For 9 archetypes Claude works deterministically; for A10 (Local Trust) Claude also uses vision to analyse uploaded team/trust photos. The composed prompt + reference ad + components + client photos goes to ChatGPT Image 2, which renders the final 1080×1080 PNG. The PNG is stored to the client file and the global ad database.

---

## What Bray needs from each phase

**From Claude Code:**
- A working version where uploads through the UI actually save to disk under `assets/`
- Help working through `ASSET_CHECKLIST.md` — uploading reference ads, components, brand logos, stock photos
- Components data file gets updated as new things are added

**From the tech guy:**
- Replace the local Claude Code setup with production infrastructure
- Connect real Claude API for the Master AI prompt composition + vision
- Connect ChatGPT Image 2 API for final image generation
- Replace JSON files with a database
- Add auth + hosting + deployment
