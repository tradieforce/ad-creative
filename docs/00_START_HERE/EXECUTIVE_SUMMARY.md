# Executive Summary

The system in 5 minutes.

## The product

Tradie Force is a marketing agency for Australian residential ducted A/C installers. The system generates ~25-40 production-ready Meta ads per client, automatically, with human review before publication.

## The flow (start to finish)

1. **Onboard a client** — fill a form: business name, city, region, Google review count, photos available, brands installed, default promo %.
2. **Layer 1 (Gating Engine, deterministic)** reads the spec + onboarding row, decides which archetypes fire, picks variants, resolves asset URLs. Outputs a pack manifest. ~50ms.
3. **Layer 2 (Claude Composer, vision-enabled)** runs per-ad. Sees attached photos. Sees the full pack manifest. Composes a custom ChatGPT-ready prompt that's tailored to the client's brand colours (extracted from photos), pack balance, and archetype pattern. ~5-15 sec/ad.
4. **Layer 3 (ChatGPT gpt-image-1)** receives the composed prompt + locked component attachments. Renders 1080×1080 (or 1080×1350) PNG.
5. **Review queue** — Bray approves/regenerates/edits each ad.
6. **Meta upload** — approved ads exported as zip, uploaded manually (Phase 1) or via Meta Marketing API (Phase 2).

## The 10 archetypes

| Code | Name | When | Variants |
|------|------|------|----------|
| A1 | Energy Bill Hero | Always | 1 |
| A2 | Speed Guarantee | Always | 2 |
| A3 | Luxury Lifestyle | Always | 2-3 |
| A4 | Problem/Solution Urgency | Always | 2-3 |
| A5 | Seasonal Pain | Always | 2 |
| A6 | Seasonal Sale Event | Always | 5 |
| A7 | City Massive Sale | Always | 2-3 |
| A8 | Localized Clearance | Always | 1 |
| A9 | Holiday Event | Always | 10 (one per major retail holiday) |
| A10 | Local Trust | If client has team/owner/van photo | 1-3 |

Pricing variants (per_week / fixed_price / no_price) generate where applicable. One fixed-price ad per pack max — Layer 2 picks the winner.

## The architectural decisions that matter

1. **Vision-based composition is non-negotiable.** Sharp Air Conditioning A10 test proved this: orange wall + blue stripe + navy polos in the photo drove the entire ad palette when Claude was given the photo as visual input.

2. **Locked components never AI-generated.** Diagrams, condensers, brand logos, client photos. AI never invents these — they're attached as image inputs. ChatGPT cannot draw a ducted house diagram correctly. We tried four times.

3. **Pack-aware composition.** Layer 2 sees the full manifest. Without it, every ad would default to the same safe choices. With it, Layer 2 can balance funnel coverage and award the single fixed-price slot to the strongest candidate.

4. **Always-fires architecture.** Every variant generates upfront from day one. No date-window gating. Pack becomes a year-long content library.

5. **Review queue, never auto-publish.** Human-in-loop. Cost of one bad ad live > cost of human review time, by orders of magnitude.

6. **Spec JSON is source of truth.** Re-export to update. Version-controllable. Cached in memory.

## Cost & time per pack

- ~25 ads per pack
- ~$0.50 AUD per pack (Anthropic + OpenAI API costs)
- ~5-10 min generation time + ~10-15 min Bray review
- Compare: ~$300-500 for the same volume from a freelance designer

## Tech stack (recommended)

- **Anthropic API** (Layer 2) — `claude-opus-4-7` or `claude-sonnet-4-6`
- **OpenAI API** (Layer 3) — `gpt-image-1`
- **Postgres / Supabase** — state
- **S3 / Cloudflare R2** — asset storage
- **BullMQ (Redis)** — job queue
- **Next.js / Remix** — review queue UI
- **Sentry** — error tracking
- **Meta Marketing API** — Phase 2 ad upload

## What's pending

- Bray fills city-keyed prices in the spec
- Bray uploads ~45 locked component assets (highest priority: house diagrams)
- Tech build per the 4-week sequence
- First real client → calibration pass on Layer 2 system prompt

Read `02_ARCHITECTURE/system_workflow_visual.html` for the visual version.
