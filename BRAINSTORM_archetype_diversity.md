# Brainstorm — Archetype × Component diversity expansion

> **Status:** Note for later. Test first round of generations before acting on this.
> **Date dropped:** 2026-05-08

## The thought

Right now most archetypes lean on a small fixed set of components per slot. e.g. A1 Energy Bill Hero "house diagram OR person holding bill OR savings graph". The system has way more variety than that — 250+ wired components — and the archetype configs may be more conservative than necessary.

The idea: a single archetype like "Save on Energy Bills" could legitimately use MANY hero compositions:
- House diagram (current default)
- Condenser hero (showing the product that saves them money)
- Outlet/vent close-up (focusing on the comfort it delivers)
- Bill-holder reaction shot
- Wallet + coins (the savings made tangible)
- Stock family on couch (lifestyle outcome)
- Mix of the above (split layout)

Letting Master AI rotate across these per generation would produce way more visual variety in a client's pack than current setup, especially when running multiple ads of the same archetype across different cities.

## Why this is "for later" not "now"

- We haven't generated any real ads yet. We don't know what works.
- Each archetype's CURRENT component selections came from the original spec (gold standards) which were tested. They WORK. Expanding without testing risks breaking the things we know are good.
- The first round of test generations will tell us:
  - Which archetypes feel templated/stale and need wider component access
  - Which combinations actually produce good ads vs ones that fall flat
  - Where the boundaries are (e.g. does A4 Pain still hit if you put a bright family photo in it? Probably not. But A1 might handle a wider mood range fine.)

## What to look at after first generations

For each archetype, ask:
1. **Did the generated ads feel templated?** (same hero shot every time → expand component access)
2. **Did Master AI rotate the components it had access to?** (if it kept picking the same one → maybe the others don't fit)
3. **Did the diversity rule fire?** (per HR diversity, ads in same client's pack should differ visually)

## Candidates for "louder" component access (expand earlier)

Hypotheses to test:
- **A1 Energy Bill Hero** — already has bill-holder, savings_graph, wallet variants in its pool but tends to default to house_3d_blue. Could push wider — outlet close-up + savings graph is an interesting "less obvious" angle.
- **A6 Seasonal Sale Event** — has 158 components in its pool already (biggest). May actually be over-broad; trim if generations feel scattered.
- **A4 Problem/Solution** — currently leans heavily on diagram or wallet. Bill_shock_red shots could work as a third hero. Could also benefit from condenser (the solution) being shown more often.
- **A8 City Massive Sale** — already pulls from many categories. Test if zoning diagrams + ducting components actually land or feel technical-overload.

## Candidates for "quieter" / restricted access (narrow if generations show this)

- **A3 Luxury Lifestyle** — premium positioning. If too many components are accessible, the AI might default to non-premium choices. May need to be MORE restrictive (e.g. only premium-feeling stock_family + brand logos + outdoor_modern_home, no bill/wallet/reaction).
- **A10 Local Trust** — the photo MUST be the client's actual photo. If we let it access too many stock components, the AI might pick stock over the client photo. Already restricted; keep that way.

## Implementation idea (for after testing)

Could add a per-archetype `diversity_breadth` setting:
- `narrow` — current behaviour, ~10-30 components
- `medium` — current behaviour for most, ~50-100 components
- `wide` — let Master AI rotate freely across the full applicable pool

Or just iterate on `usedBy[]` arrays based on what the data tells us.

## Action

Don't change anything until we've generated 1-2 packs and seen the output. Then revisit this note with concrete examples of "this archetype was too repetitive" or "this combo worked surprisingly well."
