# Cost Model

Per-pack economics. Costs scale linearly with ad count. The agency's revenue model isn't dependent on per-ad cost — finance commission on closed deals dwarfs creative cost — so the cost ceiling here is comfortable.

## Per-pack costs

Assumptions: pack of 25 ads, 80% per-week / 5% fixed-price / 15% no-price split, prompt caching enabled.

| Layer | Per ad (USD) | Per ad (AUD) | Per pack of 25 |
|---|---|---|---|
| Layer 1 (gating) | $0.00 | $0.00 | $0.00 |
| Layer 2 (`claude-opus-4-7` + caching) | ~$0.08 | ~$0.12 | ~$3.00 |
| Layer 2 (`claude-sonnet-4-6` + caching) | ~$0.03 | ~$0.04 | ~$1.10 |
| Layer 3 (`gpt-image-1` 1024×1024) | ~$0.21 | ~$0.32 | ~$8.00 |
| Layer 3 (`gpt-image-1` 1024×1536, A9 heavy) | ~$0.27 | ~$0.40 | (variable) |
| **TOTAL — Opus + caching** | ~$0.29 | ~$0.45 | **~$11 AUD** |
| **TOTAL — Sonnet + caching** | ~$0.24 | ~$0.36 | **~$9 AUD** |

## Reality check

~$11 AUD per pack of 25 production-ready ads vs ~$300-500 for the same volume from a freelance designer. Unit economics work. **Cost is not the constraint — quality and review time are.**

## Time budget per pack

| Step | Time |
|---|---|
| Onboarding form fill (one-time per client) | ~5 min |
| L1 gating | ~50ms |
| L2 composition (25 ads, 4 parallel workers) | ~2-3 min |
| L3 image gen (25 ads, 4 parallel workers) | ~5-8 min |
| Bray review (25 ads) | ~10-15 min |
| **Total wall-clock** | **~15-25 min** |

## What drives cost up

- **Regenerations** — every L3 regen = +$0.21. Budget for 1 in 5 ads needing 1 regen = +20% L3 cost.
- **Recompositions** — every L2 recompose = +$0.08. Less common.
- **Pack size growth** — adding new archetypes or variants. Linear.

## What drives cost down

- **Prompt caching** — saves ~60% on L2 system prompt cost. Always enable.
- **Sonnet over Opus** — saves ~60% on L2. Quality acceptable but slightly less polished.
- **Lower L3 quality setting** — saves ~30% but quality drops. Don't.
- **Image dimensions: 1024×1024 instead of 1024×1536** — already the default. Only A9 heavy uses portrait.

## Telemetry to track

Per pack:
- Total cost USD
- L2 cost (sum of generation_jobs where layer='L2')
- L3 cost (sum of generation_jobs where layer='L3')
- Regeneration count (sum of ads.regeneration_count)
- Recomposition count
- Wall-clock from generation start to all rendered

Aggregated:
- Cost per client per month
- Average regenerations per ad (proxy for quality)
- L2 cache hit rate (should be >80% within a pack)
- L3 retry rate (should be <20%)

## Budget alerts (Sentry / monitoring)

- Pack cost > $20 USD → investigate. Probably high regen count or prompt-caching not working.
- L3 retry rate > 30% over a week → quality regression. Check Layer 2 outputs.
- Anthropic / OpenAI rate limit errors → bump worker count down or upgrade rate tier.

## Pricing the agency's service

Cost is so low relative to value that the agency can charge any reasonable price for the service. Reference points:
- Freelance designer: $300-500 per 25 ads
- Agency creative team: $1,000-3,000 per month
- This system: $11 in API costs + Bray's review time
