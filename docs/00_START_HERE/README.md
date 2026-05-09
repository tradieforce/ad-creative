# Tradie Force Ad Generation System
## Complete Handoff Bundle

This folder contains everything needed to build the Tradie Force automated ad generation system. It's the result of an extended design + prototyping session and contains:

- The full architecture and all design decisions
- The validated production system spec (10 archetypes, 17 hard rules, 45 components)
- 8 production-tested gold-standard prompts (composition + ChatGPT outputs)
- The 38 reference ads that drove the design
- The Layer 2 system prompt (~24KB, production-ready)
- A visual workflow diagram of the entire system
- An editable HTML spec tool (the source-of-truth UI)
- Complete tech stack, database schema, build sequence, cost model, and operational runbook

---

## How to use this bundle

### If you're handing this to Claude Code or Codex
Open `01_BUILD_INSTRUCTIONS/BUILD_THIS.md`. That document is purpose-written to be the prompt — it tells the agent exactly what to build, in what order, with explicit links to every supporting doc in this bundle. You can literally say:

> Read `01_BUILD_INSTRUCTIONS/BUILD_THIS.md` and follow it.

### If you're a human reading this for the first time
Read in this order:
1. `00_START_HERE/README.md` (this file) — orientation
2. **`00_START_HERE/THE_METHOD.md` — the simple 6-step per-ad recipe (start here for the mental model)**
3. `00_START_HERE/EXECUTIVE_SUMMARY.md` — the system in 5 minutes
4. `02_ARCHITECTURE/system_workflow_visual.html` — open in browser, scroll the visual workflow
5. `02_ARCHITECTURE/architecture_overview.md` — written architecture
6. `01_BUILD_INSTRUCTIONS/BUILD_THIS.md` — the build instructions
7. Then dig into `03_SPEC/`, `04_LAYER2/`, `05_GOLD_STANDARDS/` as needed

---

## Folder map

```
tradie_force_system/
├── 00_START_HERE/              ← Read first. Orientation + executive summary.
├── 01_BUILD_INSTRUCTIONS/      ← The "give to Claude Code" doc.
├── 02_ARCHITECTURE/            ← System architecture: layers, decisions, visual workflow.
├── 03_SPEC/                    ← The system spec (JSON source of truth) + readable docs.
├── 04_LAYER2/                  ← Layer 2 (Claude Composer) system prompt.
├── 05_GOLD_STANDARDS/          ← 8 production-tested prompts (input + output + lessons).
├── 06_REFERENCE_IMAGES/        ← 38 reference ads (A01-A38) the system was designed against.
├── 07_BUILD_PLAN/              ← Tech stack, schema, API specs, week-by-week sequence.
├── 08_OPERATIONS/              ← Cost model, manual vs auto, runbook.
├── 09_INTERACTIVE_TOOLS/       ← The editable HTML spec tool (open in browser).
└── 10_PROJECT_SCAFFOLD/        ← Starter files for the actual codebase.
```

---

## Quick context

**What the system does.** Generates ~25-40 production-ready Meta ads per client per pack, automatically. Bray (the agency owner) onboards a residential ducted A/C installer client through a form. The system reads the spec, decides which archetypes fire for that client, composes per-ad ChatGPT prompts using vision-enabled Claude, generates the images via gpt-image-1, and surfaces them in a review queue for approval before Meta upload.

**Three layers.**
- **L1 Gating Engine** — deterministic, no AI. Decides which ads to fire.
- **L2 Claude Composer** — vision-enabled. Composes per-ad prompts. Pack-aware.
- **L3 ChatGPT Image Gen** — renders the actual PNG.

**Always-fires architecture.** Every archetype generates upfront for every client (except A10, conditional on photo). Holiday + seasonal + pricing variants all generate from day one. Launch each as the date applies. Pack becomes a year-long content library on day one.

**~$0.50 AUD per pack, ~5-10 min wall-clock.**

---

## Who built what

This system was designed iteratively over several sessions through:
- Live ChatGPT image-gen testing of 8+ archetype prompts
- Capturing what worked/didn't work as gold standards
- Building an editable HTML spec tool to iterate the spec
- Prototyping a client-onboarding simulator
- Validating architectural decisions through real generations (vision-based composition, locked components, pack-aware composition, always-fires)

The decisions in `02_ARCHITECTURE/critical_decisions.md` were each tested before being committed. Don't change anything load-bearing without re-reading them.

---

## Action items pending

Things Bray still needs to do (manual):
- Fill fixed prices and rebate amounts per city in the price library
- Upload component assets via the spec tool (45 component slots; priority on house diagrams)
- Onboard first real client → tune Layer 2 system prompt based on real output

Things the tech build needs to deliver:
- Backend orchestration (Anthropic + OpenAI APIs, asset storage, DB, queue)
- Review queue UI
- Onboarding form (production version)
- Meta upload workflow (Phase 1: manual zip; Phase 2: API)

See `07_BUILD_PLAN/4_week_sequence.md` for the recommended build order.
