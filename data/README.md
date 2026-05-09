# /data — extracted configuration data

Source of truth for all configuration. Files in this folder mutate as Bray edits things in the UI.

## Files

| File | Purpose |
|---|---|
| `archetypes.json` | All 10 archetype configs (rules, variable input pools, components) |
| `global-rules.json` | 17 hard rules |
| `components.json` | Global components library (records, not images — images live in `assets/components/`) |
| `prices.json` | Per-city pricing (per-week, fixed, RRP, rebate) |
| `master-prompt.md` | The Master AI system prompt that drives Claude |

## Files added later (Phase 2 / production)

| File | Purpose |
|---|---|
| `clients/{client-id}.json` | Per-client onboarding data + uploaded asset references |
| `ads.json` (or `ads/`) | All generated ads with their prompts and metadata |

## How edits flow

1. Bray opens the UI (`ui/index.html`)
2. Bray edits a rule / adds a headline / uploads a component
3. The UI POSTs to the local server (or production API)
4. The server writes back to the corresponding JSON file (or Postgres in production)
5. The next page load reads the updated data

The mockup (current state) embeds all this data in the HTML at build time. Phase 1 of the Claude Code handoff is to load it from these files instead.
