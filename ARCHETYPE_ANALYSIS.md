# Archetype Analysis — Variable Pools, Components, Capacity

> Deep analysis of all 10 archetypes as configured in `data/archetypes.json` after the A7/A8 restructure. Identifies gaps in variable pools, missing components, schema drift, and a prioritised action list.

---

## Executive summary

1. **Three archetypes have no Visual hero options pool at all (A6, A9, A10).** Master AI is forced to invent a hero composition from scratch each time. This is the single biggest variety gap — the visual hero is what makes one ad feel different from another.
2. **Schema drift across pool names.** A4 uses "Solution lines" instead of "Value stacks". A7 has "Sub-headlines" + "Trust pills" but no "Badges". Only A7 and A10 have "Sub-headlines". Inconsistent contracts make Master AI harder to drive deterministically.
3. **CTA pool is heavily redundant.** Same string ("REQUEST A FREE QUOTE TODAY!", "BOOK YOUR FREE QUOTE", "CLAIM TODAY") appears in 4+ archetypes' pools. We're maintaining the same content in 10 places — drift is inevitable.
4. **Components are 95% empty.** All 45 component records exist in `data/components.json` but **zero have an image attached**. This is the Phase 2 work — flagged here so it's part of the full picture.
5. **The price library is half-built.** Every city has `perWeek` set, but all 19 cities have empty `fixed`, `anchor`, and `rebate` fields. HR07 forbids fixed-price ads when the city has no fixed price → the fixed-price variants of A4 and A8 currently can't fire.
6. **Critical missing component categories.** Bill-holder photos (A1), wallet/coins photos (A4), tradesman/installer portraits (A9 has only 1), holiday backgrounds (A9), more reaction stock (A5/A6 only have 6 total).
7. **Variant structure is implicit, not declared.** A2, A4, A8, A9 all have multiple sub-variants (cold-warm/warm-hot, wallet/diagram, aggressive/clean, heavy/clean) but no `variants` field captures them. Master AI has to infer — a recipe for inconsistency.
8. **Practical capacity per archetype is bottlenecked by visual hero count, not by headlines.** A1 says 40,320 theoretical combos but really only ~15 truly distinct ads. A6/A9/A10 are at ~0 truly distinct without a hero pool — they all look the same.
9. **Stock photo shopping list is concrete and small.** ~25 stock photos (family lifestyle, reactions, wallets/bills, tradesmen, holiday backdrops) covers 90% of the gaps. Can be sourced in a single afternoon.
10. **Quickest 80% win:** add Visual hero options pools to A6/A9/A10, normalise A4's pool name, and populate fixed-price + rebate fields for ~6 priority cities. This unlocks the bulk of the latent capacity already in the system.

---

## The big scorecard table

Pool sizes by archetype. Numbers in parentheses are sub-pool variants (e.g. A5 has separate summer / winter headline pools).

| Code | Name | Funnel | Headlines | Value stacks | CTAs | Badges | Visual hero | Sub-head | Trust pills | Total pools | Status |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| **A1** | Energy Bill Hero | Cold/Warm | 15 | 7 | 8 | 8 | **6** | — | — | 5 | OK |
| **A2** | Speed Guarantee | Cold/Warm + Warm/Hot | 12 | 5 | 7 | 7 | **4** ⚠ | — | — | 5 | Hero light, no variants captured |
| **A3** | Luxury Lifestyle | Cold/Warm premium | 15 | 7 | 6 | 9 | **7** | — | — | 5 | OK |
| **A4** | Problem/Solution Urgency | Warm/Hot + Cold/Warm | 13 | 6\* | 6 | 7 | **5** | — | — | 5 | "Solution lines" should be "Value stacks"; no variants captured |
| **A5** | Seasonal Pain | Cold/Warm | 10 (s) + 9 (w) | 4 ⚠ | 6 | 6 | **7** | — | — | 6 | Value stacks light |
| **A6** | Seasonal Sale Event | Warm/Hot | 5+4+4+4+4 | 4 ⚠ | 6 | 6 | **0** ❌ | — | — | 8 | **NO hero pool** |
| **A7** | Brand Sale | Warm/Hot | 10 | 5 | 5 | — | **3** ⚠ | 4 | 6 | 6 | Hero light, no badges (deliberate but worth confirming) |
| **A8** | City Massive Sale | Warm/Hot | 21 | 9 | 10 | 9 | **7** | — | — | 5 | Healthiest archetype after the merge |
| **A9** | Holiday Event | Hot | 11 | 4 ⚠ | 5 | 7 | **0** ❌ | — | — | 4 | **NO hero pool**, no variants captured |
| **A10** | Local Trust | Cold/Warm (conditional) | 10 | 4 ⚠ | 5 | 7 | **0** ❌ | 5 | — | 5 | **NO hero pool** (relies on client photo, but still needs structured options) |

Legend: ✓ = OK · ⚠ = below 5-7 target · ❌ = missing entirely · ⚙ = schema fix needed

---

## Variable pool deep-dive

### Visual hero options — the biggest gap

The visual hero is the dominant lever for "this ad looks different from that ad". When this pool is missing or thin, every generation feels the same. **A6, A9, A10 have NO visual hero pool at all.** Recommendations:

**A6 Seasonal Sale Event** needs ~8 hero options:
- "Sweating man with hands up — left half edge-to-edge"
- "Cold woman in winter clothes — left half"
- "Couple bundled up, frustrated — left half"
- "Family pointing at thermostat with shock"
- "Locked condenser product shot — right side, ~40% canvas"
- "House diagram (locked) showing zones with discount overlay"
- "Reaction model with discount badge overlap"
- "Outdoor heatwave / heatmap visual with reaction model inset"

**A9 Holiday Event** needs ~6 hero options:
- "Tradesman portrait (locked stock) full-canvas hero — heavy variant"
- "Locked condenser product shot — clean variant, ~50% canvas"
- "Holiday name oversized as type-led hero (Easter / Black Friday / Christmas)"
- "Calendar fragment / countdown timer hero overlay"
- "Family in seasonal context (Christmas tree, summer BBQ) — lifestyle variant"
- "Holiday icon + condenser combo (e.g. fireworks behind condenser)"

**A10 Local Trust** needs ~5 hero options (even though client photos drive most variants):
- "Team-on-van photo — full-canvas, palette derived from photo"
- "Owner portrait — left-half, full-bleed"
- "Van photo with team standing alongside — full-canvas"
- "Bill-holder client photo (rare — A1 territory normally) for owner-led trust angle"
- "Group team photo in shop / warehouse — wider environmental shot"

If a client doesn't have any team/owner/van photo, A10 doesn't fire (per HR17). The hero options here are about which uploaded photo Master AI picks WHEN the client has multiple photos available.

### CTA redundancy — consolidate to a global pool

10 CTA strings appear in 2+ archetypes. Maintaining the same content in 10 places guarantees drift — one pool gets a new CTA, others don't, and Master AI gets uneven coverage.

**Most-duplicated CTAs (cleanup candidates):**
- "REQUEST A FREE QUOTE TODAY!" — A1, A4, A5, A8 (4×)
- "BOOK YOUR FREE QUOTE" — A1, A5, A7, A8 (4×)
- "CLAIM TODAY" — A4, A6, A8, A9 (4×)
- "GET QUOTE" — A2, A8, A9 (3×)
- "GET A FREE QUOTE" — A7, A10 (2×)

**Recommendation:** introduce a global CTA pool (`data/ctas.json`) with all unique CTAs. Each archetype carries an `allowed_ctas` filter (whitelist of which CTAs fit its tone) instead of duplicating strings. Or simpler interim: dedupe within archetypes and rely on Master AI's discretion.

### Value stacks — A5/A6/A9/A10 thin

- A5 (4) — should be 6+. Seasonal pain ads benefit from varied value stacks because the same season recurs many times.
- A6 (4) — same logic, plus A6 has 5 seasonal sub-variants — 4 value stacks across 5 variants means duplication is forced.
- A9 (4) — holiday-specific. Add 2-3 more.
- A10 (4) — trust-led. Add 2-3 more (testimonial-style framing).

### Headlines — A6 is structurally awkward

A6 has 5 separate headline sub-pools (winter_sale, autumn_sale, cool_upgrade, heat_upgrade, heatwave) totalling 21 headlines but each individual variant only has 4-5 options. If a client runs A6 every month for 6 months, only 1-2 of those variants actually fire (depending on season), so each variant only has 4 headlines available — repetition hits fast.

**Recommendation:** raise each seasonal sub-pool to 8 minimum (40 total). Or restructure: one "Headlines" pool with seasonal tagging (`{ text: "...", seasons: ["summer","heatwave"] }`), so Master AI filters by season at composition time.

### Sub-headlines — only 2 archetypes have them

A7 (4) and A10 (5). Other archetypes (A1, A8 especially) could benefit from a sub-headline slot for the "FROM ${{per_week}}/WEEK" / "10kW DUCTED A/C SYSTEM" line that consistently appears.

**Recommendation:** add sub-headline pools to A1, A2, A8 — these are price-led ads that always have a line under the headline that's currently being composed by Master AI ad-hoc.

### A4's "Solution lines" — schema drift

A4 has `Solution lines` where every other archetype has `Value stacks`. The content is similar (multi-line benefit list). Master AI has to know to map `Solution lines` to the value-stack slot in the prompt.

**Recommendation:** rename to `Value stacks` for consistency. Zero functional change, eliminates a special case.

---

## Component inventory & gaps

### Current state

| Category | Count | With image | Used by archetypes | Orphans |
|---|---:|---:|---|---|
| Brand logo | 12 | 0 | All + A7 (brand strip hero) | — |
| Condenser | 7 | 0 | A7, A8, A9 | — |
| Controller | 3 | 0 | A8 | — |
| Ducting | 2 | 0 | A8 | — |
| House diagram | 4 | 0 | A1, A4, A5, A6, A8, A10 | `house_outline` (orphan) |
| Outlet | 5 | 0 | A6, A9 | `outlet_linear_1`, `outlet_linear_2`, `outlet_square` (orphans) |
| Stock family | 4 | 0 | A2, A3 | — |
| Stock reaction | 6 | 0 | A5, A6, A9 | — |
| Trust badge | 2 | 0 | A10 | — |
| **Total** | **45** | **0** | | **4 orphans** |

### Gaps by archetype

**A1 Energy Bill Hero** — needs:
- Bill-holder stock photo ("middle-aged Australian homeowner holding electricity bill") — referenced in master prompt but no component exists.
- Savings-graph illustration (downward arrow, currency icon).
- Side-by-side traditional A/C vs ducted system (referenced as a hero option, no component).
- Energy efficiency rating chart or savings graph (referenced as hero option, no component).

**A4 Problem/Solution Urgency** — needs:
- Wallet/coins photo (warm/hot variant hero — currently has no component for this!)
- Bill with shock/red lines (urgency angle).
- Currently only has `house_3d_dark` component.

**A5 Seasonal Pain** — has 2 reaction photos (`react_sweating_man`, `react_freezing_fam`). For a year-round archetype with 19 headline options, this is thin. Add:
- `react_sweating_woman` (gender variety)
- `react_kids_hot` (family pain angle)
- `react_couple_freezing` (winter couple)
- `react_elderly_cold` (vulnerable demographic)

**A6 Seasonal Sale Event** — uses A5's reaction photos. Could share, but A6's mood is different (sale energy, not pain). Add:
- `react_pointing_to_sale` (woman pointing at price)
- `react_thumbs_up_summer` / `react_thumbs_up_winter` (positive sale energy)
- Heatwave / cold-snap atmospheric backgrounds

**A7 Brand Sale** — needs the brand strip (12 logos already exist) + condenser. Image-wise it's the best-served archetype after the recent restructure. Optionally add:
- Outdoor backdrop variants (sky-blue, sunset, neutral cream) for palette variety

**A9 Holiday Event** — needs:
- Tradesman portrait stock (only `react_tradesman` exists — need 3-4 more for variety across holidays)
- Holiday-specific backdrops (snow, fireworks, Easter, Boxing Day, Black Friday)
- Holiday icon set (gift, sleigh, fireworks, calendar)
- Locked condenser variants (already covered)

**A10 Local Trust** — uses client photos primarily. But trust badges:
- Currently only `google_5star` and `mhi_diamond`.
- Add: HIA member, Master Plumber, Lifetime Warranty, Family Owned & Operated, Australian Owned, Award Winner.
- These should also be available as overlays on A1/A2/A3 if the client qualifies.

**House diagrams** — 3 in use, 1 orphan (`house_outline`). For A8's 4 different hero variants (condenser, diagram, zoning, controller-led) we have only 2 diagram variants used: `house_3d_blue` and `house_3d_zones`. Add:
- `house_3d_modern` (contemporary architecture)
- `house_3d_premium` (A3 premium variant — bigger home, designer aesthetic)
- `house_2d_cutaway` (cutaway side view, technical-explainer variant)

**Outlets** — 5 records, 3 orphans. The `outlet_linear_*` and `outlet_square` aren't currently referenced by any archetype. Either:
- Repoint them: linear outlets → premium A3 (modern designer aesthetic), square → A8 zoning variant.
- Or delete them.

---

## Stock photo shopping list

If you want to source these in one batch (Adobe Stock / Unsplash / Shutterstock — Australian-leaning where possible):

### Family lifestyle (currently 4, target 12)
- Family of 4 in modern living room, summer relaxed (existing: `fam_couch_summer`)
- Family of 4 in modern living room, winter cozy (existing: `fam_couch_winter`)
- Father piggybacking child (existing: `fam_piggyback`)
- Family jumping in living room (existing: `fam_jumping`)
- **NEW:** Couple with laptop researching (A2 cold/warm variant)
- **NEW:** Couple on couch evening lighting (A3 premium)
- **NEW:** Family at dinner table (A2/A3 lifestyle)
- **NEW:** Kids playing in living room (A2 family-friendly)
- **NEW:** Couple relaxed reading (A3 quiet luxury)
- **NEW:** Mum + toddler in kitchen (A3 lifestyle)
- **NEW:** Multi-gen family (A10 lifestyle alternate)
- **NEW:** Dog + family relaxed (A3 lifestyle warmth)

### Reaction photos (currently 6, target 12)
- Sweating man hands up (existing: `react_sweating_man`)
- Family bundled up cold (existing: `react_freezing_fam`)
- Cold woman winter clothes (existing: `react_cold_woman`)
- Woman pointing up at price (existing: `react_pointing_up`)
- Woman in white sweater (existing: `react_woman_white`)
- Tradesman thumbs-up (existing: `react_tradesman`)
- **NEW:** Sweating woman fanning self (A5 summer variety)
- **NEW:** Couple freezing on couch (A5 winter couple)
- **NEW:** Frustrated bill-holder (A1 universal hero)
- **NEW:** Shocked bill-holder (A4 pain variant)
- **NEW:** Smiling install reaction (A2 satisfaction)
- **NEW:** Elderly person cold/uncomfortable (A5 vulnerable)

### Bill / wallet / financial pain (currently 0 components, NEED these)
- **NEW:** Hand holding electricity bill, $ amount visible (A1 universal hero — currently absent!)
- **NEW:** Wallet with coins falling out, dark side-light (A4 wallet hero — currently absent!)
- **NEW:** Calculator + bill on desk (A1 / A4 explainer)
- **NEW:** Bill with red highlight, shock visual (A4 urgency)
- **NEW:** Stack of bills with downward arrow (A1 savings angle)

### Tradesman / installer (currently 1, target 5)
- Tradesman thumbs-up portrait (existing: `react_tradesman`)
- **NEW:** Tradesman with toolbox, smile (A9 holiday variant)
- **NEW:** Two tradesmen on job site (A2/A10 alternate)
- **NEW:** Tradesman shaking client's hand (A10 trust)
- **NEW:** Female tradesman / electrician (gender diversity)

### Holiday / seasonal backdrops (currently 0, NEED for A9)
- **NEW:** Snow-covered roof / Christmas atmosphere (Christmas / winter)
- **NEW:** Fireworks (New Year)
- **NEW:** Easter / pastel spring (Easter)
- **NEW:** Australian summer beach (Boxing Day / Australia Day)
- **NEW:** Black/red Black Friday backdrop
- **NEW:** Generic countdown timer / calendar fragment

### Outdoor / atmospheric (for A7 / A8)
- **NEW:** Bright blue sky + green grass (A7 hero default)
- **NEW:** Suburban Australian street (A8 city anchor)
- **NEW:** Modern Australian home exterior (A1 hero alternate)
- **NEW:** Heatwave / sunset Australian outdoor (A5/A6)

### Trust badge graphics (currently 2, target 8)
- Google reviews badge (existing: `google_5star`)
- MHI Diamond Dealer (existing: `mhi_diamond`)
- **NEW:** HIA member
- **NEW:** Master Electricians badge
- **NEW:** Family Owned & Operated badge (custom design)
- **NEW:** Lifetime Warranty badge (custom design)
- **NEW:** Australian Owned badge (custom design)
- **NEW:** Daikin / Mitsubishi / Samsung dealer badges (per brand)

### Total acquisition target
- Lifestyle: 8 new
- Reaction: 6 new
- Bill / wallet: 5 new
- Tradesman: 4 new
- Holiday backdrops: 6 new
- Outdoor / atmospheric: 4 new
- Trust badges: 6 new
- **= ~39 stock images / graphics to source**

Realistically half could come from Unsplash (free, royalty-free) and half from Adobe Stock for the more specific Australian / branded shots.

---

## Schema & structural recommendations

### 1. Normalise pool keys

| Current | Should be |
|---|---|
| A4: `Solution lines` | `Value stacks` |
| A5: `Headlines (summer)` + `Headlines (winter)` | `Headlines` (each with `seasons: ["summer"]` tag) |
| A6: 5 separate `Headlines (...)` pools | `Headlines` (each with `seasons: [...]` tag) |
| Some have `Sub-headlines`, others don't | Add to A1, A2, A8 |
| A7 has `Trust pills (footer)`, others have `Badges` | Either rename A7's pool to `Trust pills` (a new canonical) or fold it into `Badges` with a placement hint |

A clean canonical schema:
```
Headlines
Sub-headlines
Value stacks
CTAs
Badges
Visual hero options
Trust pills    (footer / corner / side)
```

Each pool item could optionally carry tags: `{ text: "...", seasons: [...], variants: [...], price_treatments: [...] }`.

### 2. Declare variants explicitly

A2, A4, A8, A9 all have multiple sub-variants but no field captures them. Add a `variants` array per archetype:

```json
"variants": [
  { "key": "wallet", "label": "Wallet hero (warm/hot)", "funnel_stage": "Warm/Hot",
    "hero_filter": ["wallet"], "headline_filter": ["wallet_pain"] },
  { "key": "diagram", "label": "Diagram hero (cold/warm)", "funnel_stage": "Cold/Warm",
    "hero_filter": ["diagram"], "headline_filter": ["explainer"] }
]
```

Pack-balance becomes deterministic instead of inferred.

### 3. Move CTAs to a shared library

`data/ctas.json` global pool, plus per-archetype `allowed_ctas` filter (or `ctas_override` for archetype-specific only).

### 4. Add `prompt_notes` field per archetype

Earlier I flagged that nuanced direction in `master-prompt.md` (e.g. "Pack-balance cue: photo selection drives ~40% of mood") would be lost if we auto-rendered archetype patterns. Solve by adding a free-text `prompt_notes` field to each archetype that the master-prompt composer pulls in.

### 5. House diagram → break down by use case

Currently 4 generic diagrams. Better:
- `house_3d_savings` (A1) — light blue, sunshine, power-saving visual cues
- `house_3d_dark` (A4) — current dark variant for pain ads
- `house_3d_zones` (A8) — current zoning variant
- `house_3d_modern` (A3) — premium architectural style
- `house_outline_simple` (filler / explainer)

---

## Pricing data gaps

```
data/prices.json — 19 cities
- perWeek populated:    19/19 ✓
- fixed populated:       0/19 ❌ ← blocks fixed-price ads (HR07)
- anchor populated:      0/19 ❌ ← blocks "WAS $X / NOW $Y" treatments
- rebate populated:      0/19 ❌ ← blocks state-rebate variants of A8
```

**Impact:**
- A4 fixed-price variant cannot fire in any city.
- A8 fixed-price hero variant cannot fire (only per-week falls back).
- A7's per-week-only design isn't blocked, but the broader pricing palette is unavailable to the system.

**Recommendation:** populate at least the top 6 cities (Sydney, Melbourne, Brisbane, Perth, Adelaide, Newcastle) with realistic `fixed`, `anchor`, `rebate` values. Even if it's just `fixed: $9,990, anchor: $11,990, rebate: ""`. Unblocks fixed-price variants immediately.

---

## Practical capacity / combinatorial reality check

The "theoretical combinations" number on the scorecard is misleading because most picks are correlated (a winter headline goes with a winter visual; a fixed-price headline goes with a fixed-price treatment).

A more realistic measure: **truly distinct ads per archetype** = visual hero count × ~2.5 viable headline-stack variants per hero.

| Code | Hero count | Truly distinct | 6-month target (5-7) | Verdict |
|---|---:|---:|---|---|
| A1 | 6 | ~15 | ✓ | Comfortable |
| A2 | 4 | ~10 | ✓ | OK; could use a 5th hero |
| A3 | 7 | ~17 | ✓ | Comfortable |
| A4 | 5 | ~12 | ✓ | OK |
| A5 | 7 | ~12 (per season) | ✓ | OK |
| A6 | 0 | 0 | ❌ | **Blocker** — must add hero pool |
| A7 | 3 | ~7 | borderline | Add 2-3 more heroes |
| A8 | 7 | ~20 | ✓ | Healthiest |
| A9 | 0 | 0 | ❌ | **Blocker** — must add hero pool |
| A10 | 0 | n/a (client-photo-led) | uses client photos | Add hero structure for client-photo selection |

For a typical client running 6 monthly packs of ~8-10 ads each (~50 ads over 6 months), each archetype fires ~5-7 times. **A6, A9, A10 currently have no structured way to vary** — Master AI is improvising every time. That's where the inconsistency will show up first.

---

## Prioritised action plan

### Priority 1 — unblock generation (do first)

1. **Add Visual hero options pools to A6, A9, A10.** Use the lists in the "Variable pool deep-dive" section above as starting points. Without these, those three archetypes can't be reliably composed.
2. **Rename A4's `Solution lines` → `Value stacks`.** Schema fix, zero functional change.
3. **Populate `fixed`, `anchor`, `rebate` for top 6 cities** in `data/prices.json`. Unblocks fixed-price and rebate variants.
4. **Source the 5 bill / wallet stock photos** (A1 bill-holder, A4 wallet, A1 savings graph, A4 bill-shock, A1 stack-of-bills). These unblock A1 and A4's hero variants.

### Priority 2 — bring thin pools up to 5-7

5. **Beef up A5/A6/A9/A10 value stacks** to 6-7 each.
6. **Add A2's 5th hero option** (currently 4).
7. **Add A7's 4th-5th hero options** (currently 3).
8. **Add 4-6 reaction stock photos** (sweating woman, freezing couple, frustrated bill, etc.).
9. **Add 4-6 lifestyle stock photos** (couple-with-laptop, evening-couple, dog-with-family, etc.).

### Priority 3 — schema & structural cleanup

10. **Declare variants explicitly** for A2, A4, A8, A9 — add a `variants` field per archetype.
11. **Consolidate CTAs into a shared pool** with per-archetype filters. Eliminates 10+ duplicates.
12. **Add `Sub-headlines` pools to A1, A2, A8.** Currently Master AI invents these every time.
13. **Decide on orphan components:** delete or reassign `house_outline`, `outlet_linear_1/2`, `outlet_square`.
14. **Add `prompt_notes` field** to archetypes for the nuanced direction that doesn't fit other fields.

### Priority 4 — extended trust + holiday assets

15. **Source 6 more trust badge graphics** (HIA, Master Electricians, Family Owned, Lifetime Warranty, Australian Owned, brand-dealer badges).
16. **Source 6 holiday backdrops** for A9 (Christmas, NYE, Easter, Boxing Day, Black Friday, Australia Day).
17. **Source 4 outdoor / atmospheric backdrops** for A7/A8 hero variants.

### Priority 5 — long-term

18. Capture archetype-specific A2/A4/A8/A9 variants as gold standards once production output proves them.
19. Add a `prompt_notes` field to component records so each component carries its own composition guidance (e.g. cond_daikin: "always pair with logo_daikin in the brand strip").
20. Consider a learning loop: which (headline, hero, value_stack) combinations yield the best client-approved ads? Feed back into pool weighting.

---

## Quick wins I can implement right now (with your permission)

If you want, I can do the Priority 1 schema-and-structure fixes immediately:

A. Rename A4's `Solution lines` → `Value stacks`.
B. Add Visual hero options pools to A6, A9, A10 with the recommended starter content.
C. Populate fixed/anchor/rebate for the top 6 cities (using realistic $9,990 / $11,990 anchors — you can tune later).
D. Add 4-5 missing component records (bill_holder, wallet_coins, etc.) so the Components page has placeholders ready for image upload in Phase 2.
E. Reassign or delete the 4 orphan components.

These are zero-risk to the working tool (no API contract change, all additive or rename) and unblock the bulk of the latent capacity. Says "yes do A-E" or pick which ones.

Stock photo acquisition (~39 images) is your call — happy to walk you through what specifically to search for on Unsplash/Adobe Stock if helpful, but I can't source them for you.
