# The Prompt Engine — How Layer 2 Actually Composes a Prompt

> **This is the most important document in the bundle.** Everything else — gating, funnel logic, holiday calendar, pricing — is plumbing. The system stands or falls on whether Layer 2 can compose a ChatGPT prompt that produces a production-ready ad. This document reverse-engineers exactly how Claude did that across the 8 live tests, so the production Layer 2 can do the same thing deterministically every time, starting fresh from data with no chat history.

---

## The big idea

During the live testing in this chat, every successful prompt I wrote followed the same recipe. I wasn't being creative — I was running a procedure. The procedure had **5 input layers** and **1 fixed output structure**.

```
INPUT LAYERS:                                OUTPUT:
─────────────                                ───────
A. Archetype DNA          ──┐
B. Client onboarding      ──┤
C. Variable picks         ──┼──▶  Layer 2 composes  ──▶  ChatGPT-ready prompt
D. Vision analysis        ──┤    (the 7-section template)    + assets
E. Pack balance           ──┘
```

Production Layer 2 receives all 5 inputs as structured data, runs vision analysis on attachments, and emits a prompt using the 7-section template. No chat context required.

---

## The 5 input layers

### Layer A — Archetype DNA (fixed per archetype, never changes)

This is what you correctly identified as *"the easy part — we can have these fixed per archetype."* Every archetype A1–A10 has a fixed DNA record. It's the same for every client, every generation, forever. Captured in `tradie_force_spec.json` and the gold standards.

For each archetype, the DNA contains:

| Field | What it is | A7 example | A3 example | A10 example |
|---|---|---|---|---|
| `reference_ad_id` | The historical ad that's ALWAYS attached as IMAGE 1 | `A19` | `A01` | `A37` |
| `mandatory_locked_components` | What other images are always attached | condenser product shot | (none) | client photo |
| `hero_visual_type` | What the hero element IS | product shot (condenser) | lifestyle photo | client photo |
| `layout_pattern` | How the canvas is divided | top-to-bottom flow | left/right split | photo-led full-canvas |
| `funnel_stage` | Cold/Warm/Hot | Warm/Hot | Cold/Warm Premium | Cold/Warm |
| `mood_category` | Tonal slot | aggressive direct-response | refined premium | warm trust |
| `palette_strategy` | How palette is chosen | dark high-contrast + 1 accent | elegant restrained | derived from photo (vision) |
| `typography_strategy` | Type rule | bold display | sans-serif body + italic serif accent | flowing rhythm, italic serif on hero word |
| `brand_count_rule` | How many brand logos | 1 (single-brand premium) or 3 | 2 (premium positioning) | 2 (trust positioning) |
| `mandatory_elements` | Things that MUST appear or archetype fails | condenser as hero, geo banner | "QUIET LUXURY" italic serif treatment | Google reviews badge dominant |
| `forbidden_elements` | Things that must NEVER appear | people, faces, hands; review badges; multiple logos if single-brand | any pricing, urgency, sale language | discount badges, urgency timers, pain visuals |
| `clarity_rule_emphasis` | Where "DUCTED A/C" must appear | headline | headline OR sub-headline | headline (mandatory) |

You can see this DNA encoded in every prompt I wrote. **A7 always had condenser as hero, single-brand option, dark palette, no people, geo banner.** **A3 always had QUIET LUXURY italic serif, 2 brands, no price (premium variant), generous breathing room.** **A10 always had photo-led layout, palette from photo, dominant Google badge, 2 brands, no urgency.**

The archetype DNA is not invented per generation. It's read from the spec.

---

### Layer B — Client onboarding data (per client, set once at onboarding)

This came from the onboarding form (or from the test combos I made up). Set once when a client signs up, then reused across every ad in their pack and every future pack.

Required fields:
- `business_name` (e.g., "Sharp Air Conditioning")
- `city` (e.g., "Newcastle")
- `region` (e.g., "Central Coast · Newcastle · Hunter Valley")
- `state` (e.g., "NSW")
- `brands_sold` — full list of brands they install (e.g., ["Daikin", "MHI", "Samsung", "Fujitsu", "Hisense"])
- `google_review_count` — gates A10 + populates trust badges
- `install_guarantee_days` — gates A2 + populates speed badge
- `current_promo_pct` — gates A6 + populates discount badges
- `default_per_week_price` — populates price pills
- `years_in_business` — populates trust copy ("trusted locally since 2014")
- `client_assets` — uploaded photos: `team_photo`, `owner_photo`, `van_photo`, `bill_holder_photo`, etc.

This is what Layer 1 (the gating engine) reads to decide which archetypes fire. Layer 2 reads the same record to populate the prompt.

---

### Layer C — Per-generation variable picks (different every time)

This is what creates variety across the pack and across packs. Layer 1 makes these picks deterministically when building the manifest, then Layer 2 substitutes them into the prompt.

For each ad, Layer 1 picks ONE from each of these pools (defined per-archetype in `tradie_force_spec.json`):

- **Headline** — pick from the archetype's headline pool (A2 has 12, A5-summer has 10, A10 has 10)
- **Sub-headline** — pick from the sub-headline pool (or compose from template with city/region substituted)
- **Value stack** — pick from the archetype's value-stack pool
- **CTA** — pick from the CTA pool
- **Badge text** — pick from the badge pool
- **Per-week price** — pulled from the Healthy Price Library by city
- **Visual hero option** — for archetypes with multiple options (A1: house diagram OR bill-holder OR savings graph)

How Layer 1 picks: weighted random, but with **memory** — across the pack, no two ads should pick the same headline, and across consecutive packs for the same client, recently-used headlines are weighted lower. This keeps every pack feeling fresh and every client's library feeling unique.

---

### Layer D — Vision analysis (only for photo-led archetypes)

This was the breakthrough from the Sharp Air Conditioning A10 test. The first A10 attempt failed because Claude wrote a templated brief without seeing the photo. Result: bricky headline, weak palette, no brand cohesion. The second attempt succeeded because Claude *analysed the photo first*.

For any archetype with a client photo attached (A10 always; A2/A3/A5 conditionally for the lifestyle/reaction photos), Layer 2 must perform a vision pass before composing the layout sections.

Specifically, vision extracts:

| What | Why it drives the prompt |
|---|---|
| **Dominant brand colours** in the photo | Becomes the ad's palette (Sharp orange + Sharp blue + navy + cream) |
| **Visible branded text** | Must be PRESERVED in the output (phone number, URL, taglines) |
| **Subject positions and eye-lines** | Where headline goes (upper-left if subjects' eye-line is centred-front) |
| **Negative space areas** | Where to place text overlays (Sharp test: orange wall area with no person) |
| **Lighting and warmth** | Mood instruction (warm afternoon → "warm, locally rooted feel") |
| **Photo composition (split, full-bleed, portrait)** | Layout decision (full-canvas vs split-screen) |

The vision pass produces a **photo brief** that becomes part of Layer 2's input to the prompt-composition step. Without it, the system drops from production-quality to generic-templated for any photo-led archetype. **This is non-negotiable in production.**

---

### Layer E — Pack-balance decision (one final adjustment)

Last layer — a few decisions are made at the pack level, not the ad level. Layer 1 sets these in the manifest, Layer 2 substitutes them.

- **Single-brand vs three-brand positioning**: Direct-response archetypes (A4, A7) sometimes go single-brand for premium feel. Sale archetypes (A6, A8) typically go three-brand for variety. Trust ads (A10) go two-brand. Across a pack, the system mixes brand counts to avoid every ad feeling identical.
- **Price/no-price**: A3 has both a Premium (no-price) variant and a Value variant. The pack engine picks based on whether the client has a current promo running and what other ads in the pack carry the price.
- **Funnel-stage diversity**: The pack should cover Cold + Warm + Hot. If too many Cold ads have fired (A1, A3, A5), the engine biases toward firing more Warm/Hot variants in the next slot.

These adjustments are stamped into the manifest entry per ad, so by the time Layer 2 sees an entry, it just reads the values.

---

## The 7-section output template

Every successful prompt I wrote in the live tests had these 7 sections, in this order. Layer 2 fills them in mechanically using the inputs above.

```
1. ATTACHED IMAGE INSTRUCTIONS
   — One paragraph per attached image (typically 2-3 images)
   — IMAGE 1 always = reference ad: "match style, don't copy specifics"
   — IMAGE 2/3 = locked components (photos, diagrams, condensers): "use AS PROVIDED"

2. PRODUCT/LOCATION FRAMING (one sentence)
   — "Create a square 1080×1080 social media ad for a residential ducted
     air conditioning installer in {city}, Australia."

3. FUNNEL CONTEXT (one paragraph)
   — Pulled from archetype DNA + funnel stage
   — States WHO the audience is and WHAT job the ad does

4. CRITICAL CLARITY RULE (always present, near-identical wording)
   — "A scroller must understand within ONE SECOND that this ad is for
     DUCTED AIR CONDITIONING [+ any archetype-specific clarity demand]"

5. MOOD & STYLE (one paragraph)
   — Pulled from archetype DNA mood_category and palette_strategy
   — For photo-led archetypes: rewritten using vision analysis output
   — Always tells AI to "pick fresh palette/typography per generation"

6. LAYOUT (numbered sections, top-to-bottom or left/right halves)
   — Pulled from archetype DNA layout_pattern
   — Each section names its element + position + content from variable picks
   — Headline section specifies typographic treatment (which words get accent)

7. GLOBAL HARD RULES (bulleted list)
   — All 17 global hard rules
   — Plus archetype-specific forbidden_elements and mandatory_elements
   — Plus rules about preserving locked-component photos as-is
```

---

## Worked example — exactly how A10 Sharp Air Conditioning got composed

This is the prompt-build process replayed step by step, using only data that production Layer 2 would have access to (no chat context).

**Trigger event:** Layer 1 emits manifest entry for A10. Manifest entry contains:

```json
{
  "ad_id": "ad_037",
  "archetype": "A10",
  "variant": "van",
  "funnel_stage": "Cold/Warm",
  "client_id": "sharp_aircon",
  "headline_pick": "THE CENTRAL COAST'S TRUSTED DUCTED A/C TEAM",
  "sub_headline_pick": "Designed, installed & trusted locally since 2014.",
  "value_stack_pick": "Locally Owned, Family-Run | $0 Upfront, Interest-Free Finance Available | 5-Year Workmanship Guarantee",
  "cta_pick": "BOOK YOUR FREE ON-SITE QUOTE",
  "badge_pick": "168+ 5-STAR REVIEWS",
  "brand_count_pick": 2,
  "brand_logos_pick": ["Daikin", "Mitsubishi Heavy Industries"],
  "per_week_price": 55,
  "attachments": [
    {"role": "reference", "asset_id": "A37", "path": "..."},
    {"role": "client_locked", "asset_id": "sharp_team_van", "path": "..."}
  ]
}
```

**Step 1 — Read archetype DNA (Layer A):**
Layer 2 reads `tradie_force_spec.json` archetype A10:
- reference_ad_id: A37 (matches manifest)
- hero_visual_type: client photo (van variant)
- layout_pattern: photo-led full-canvas (NOT split-screen)
- mood_category: warm trust
- palette_strategy: derived from photo (vision)
- typography_strategy: flowing rhythm, italic serif on hero word
- mandatory_elements: Google reviews badge dominant, geo banner, "DUCTED A/C" in headline
- forbidden_elements: discount badges, urgency timers, pain visuals

**Step 2 — Read client onboarding (Layer B):**
- business_name: "Sharp Air Conditioning"
- region: "Central Coast · Newcastle · Hunter Valley"
- google_review_count: 168
- years_in_business: 11 (2014 → 2025)
- brands_sold: full list

**Step 3 — Manifest already has variable picks (Layer C).** Skip.

**Step 4 — Run vision analysis on Sharp team van photo (Layer D):**

Layer 2 sends the photo to Claude vision and asks for a structured photo brief. Output:

```json
{
  "subjects": "Three young men in matching navy Sharp polo shirts, sitting on van roof rack, all looking at camera",
  "eye_line": "head-on, centred",
  "dominant_colours": [
    {"name": "vibrant orange", "where": "building wall and van body", "role": "should drive ad palette"},
    {"name": "sharp blue/cyan", "where": "van stripe and phone number text", "role": "accent for trust badges and CTA"},
    {"name": "navy", "where": "polo shirts", "role": "headline weight"},
    {"name": "cream/off-white", "where": "van body", "role": "calming neutral"}
  ],
  "branded_text_to_preserve": [
    "9434 3689 (phone number on van)",
    "sharpairconditioning.com.au (URL on van)",
    "That's sharp! (tagline on wall)",
    "Sharp logo on shirts and van"
  ],
  "negative_space": "upper-left orange wall area has no person — ideal for headline placement",
  "lighting": "bright daylight, warm afternoon, soft shadows",
  "photo_composition_recommendation": "full-canvas treatment (not split-screen) — photo's environmental context is integral"
}
```

This vision output overrides the default mood/palette guidance.

**Step 5 — Pack balance already decided (Layer E).** Manifest already specifies brand_count_pick=2 with [Daikin, MHI]. Skip.

**Step 6 — Compose the prompt using the 7-section template:**

Layer 2 now has everything. It writes the prompt mechanically:

- Section 1 (image instructions): boilerplate from archetype DNA template, with vision findings injected — "DO NOT modify the people, the van, the visible branding ('Sharp', '9434 3689', 'sharpairconditioning.com.au', 'That's sharp!'), the orange wall background, or the lighting"
- Section 2 (framing): "Create a square 1080×1080 social media ad for **Sharp Air Conditioning**, a residential ducted air conditioning installer servicing **Central Coast, Newcastle, and Hunter Valley**, Australia."
- Section 3 (funnel context): from DNA — "Cold/warm audience. The job is the strongest local-trust signal in the ad pack..."
- Section 4 (clarity rule): standard text + DNA addition: "Both the product category AND the geography AND the brand identity must be unmissable."
- Section 5 (mood & style): **rewritten using vision output** — "PALETTE — DRIVEN BY THE PHOTO ITSELF: VIBRANT ORANGE (dominant), SHARP BLUE (accent), NAVY (typography), CREAM (neutral). The ad should feel like an EXTENSION of Sharp's brand, not a generic template."
- Section 6 (layout): from DNA layout_pattern (photo-led full-canvas), filled with manifest picks — headline placement uses vision's negative-space recommendation
- Section 7 (hard rules): 17 global + DNA forbidden_elements + vision-derived preservation rules

**Output:** the 7,113-character prompt that produced the winning Sharp ad. Same prompt that's in `05_GOLD_STANDARDS/A10_local_trust.json` as `full_prompt_used`.

---

## How Layer 2 stays "fresh from data" — no chat context required

The whole point of this reverse-engineering is that production Layer 2 doesn't have access to the chat where I composed these prompts originally. It needs to do the same job from structured inputs alone.

Here's how that works:

**The Layer 2 system prompt (the 24KB doc in `04_LAYER2/_LAYER_2_SYSTEM_PROMPT.md`) contains:**
- The 7-section template as instructions to Claude
- The 5 input layers explained
- All 8 gold standards as worked examples (few-shot)
- All 17 hard rules

**Per-ad input to Layer 2 is the manifest entry + attachments.** That's it. The manifest already contains everything from Layer A (archetype DNA reference), Layer B (client data), Layer C (variable picks), Layer E (pack-balance decisions). The attachments are the reference ad + locked components + client photos.

**Layer 2's job per ad:**
1. Read manifest entry → know which archetype, which picks, which client
2. Look up archetype DNA in spec
3. Read attachments → run vision pass on any client photos (Layer D)
4. Compose prompt using 7-section template
5. Return ChatGPT-ready prompt + asset list

No chat history, no human in the loop. The same procedure I was running in the live tests, but mechanised.

---

## What's variable per client and per generation

The user asked specifically about uniqueness — *"different every time and unique to each client."* Here's how variety is achieved:

| Source of variety | Mechanism |
|---|---|
| **Same archetype, different clients** | Client onboarding data (Layer B) substitutes their business name, city, region, brands, photos. A10 for Sharp pulls from Sharp's photo. A10 for next client pulls from theirs. Same archetype DNA, totally different output. |
| **Same archetype, same client, different generations** | Variable picks (Layer C) rotate through the pool. Across a 25-ad pack, A5 might fire 3 times — each pick gets a different headline, badge, value stack, sub-headline. |
| **Same client, different packs over time** | Recency weighting in Layer C downweights recently-used picks. Pack 1's headlines won't repeat in Pack 2. |
| **Same archetype, vision-driven** | Photo-led archetypes (A2, A3, A5, A10) get vision-driven palette and typography. Two clients with two different photos get visually distinct ads even if all other inputs match. |
| **Pack-internal diversity** | Pack-balance (Layer E) ensures the pack mixes single/two/three-brand ads, mixes funnel stages, mixes price/no-price treatments, mixes photo-led and product-led heroes. |

The pool sizes (10-15 headlines × 5-7 value stacks × 6-8 CTAs × 6-9 badges = thousands of unique combinations per archetype) plus vision-driven palette variation produce billions of theoretically possible outputs across clients. In practice the constraints (clarity rule, archetype DNA, funnel stage) keep all of them on-brand.

---

## What this means for your tech guy

When he reads this, he should walk away with:

1. **Layer 2 is not "Claude being creative."** It's a deterministic 5-input → 1-output procedure with vision in the middle.
2. **The 7-section template never changes.** Only the content slotted into each section changes.
3. **Archetype DNA goes in the spec.** Captured in `tradie_force_spec.json` per archetype, plus `05_GOLD_STANDARDS/` as worked examples.
4. **Client data goes in onboarding.** Captured once per client at signup.
5. **Variable picks are made by Layer 1.** Not Layer 2. Layer 1 builds the manifest with all picks already chosen.
6. **Vision analysis happens inside Layer 2.** It's the only "thinking" step Layer 2 does. Everything else is substitution.
7. **The Layer 2 system prompt + manifest entry + attachments are all the inputs needed.** No chat history. No human review of the prompt before it's sent to ChatGPT (unless review queue intercepts).

---

## The 8 gold standards as proof

Each of the 8 gold standards in `05_GOLD_STANDARDS/` was produced by the procedure above. Read them as worked examples:

- `A1_energy_bill_hero.json` — fresh-generated diagram, calm savings mood
- `A2_speed_guarantee.json` — bright daylight family photo, full-bleed, mandatory guarantee badge
- `A3_luxury_premium.json` — lifestyle photo, italic serif accent, no price, 2 brands
- `A4_pain_diagram_cold.json` — house diagram hero, dark urgent mood (cold variant)
- `A4_pain_wallet_warm.json` — wallet hero, dark urgent (warm/hot variant)
- `A5_seasonal_pain_summer.json` — sweating-man reaction photo + locked diagram
- `A7_city_massive_sale.json` — locked condenser product shot, single-brand premium
- `A10_local_trust.json` — vision-analysed Sharp photo → palette pulled from brand

Each one shows the input context, the assets attached, the composition choices that worked, the lessons for Layer 2, and the final prompt that produced the winning ad. Together they're the training reference for Layer 2's system prompt.

---

## TL;DR

Production Layer 2 takes a manifest entry + assets, runs vision on any photos, fills in a fixed 7-section template using archetype DNA + client data + variable picks + vision findings + pack-balance decisions, and emits a ChatGPT-ready prompt. The procedure is deterministic. The variety comes from rotating picks, vision differences across photos, and pack-balance stamping. No chat context. No improvisation. Just the procedure.
