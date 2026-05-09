# Worked Example — A1 Energy Bill Hero, Brisbane client

> A concrete, line-by-line trace of how a single ChatGPT prompt gets composed for one specific (client, archetype) pair. Read this AFTER `THE_PROMPT_ENGINE.md` and `INPUT_TO_SECTION_MAP.md` — those explain the model in general; this shows it in action with real values.

This worked example is the most useful single artefact for understanding the system. Every line of the composed prompt is annotated with **where it came from**, using these markers:

| Marker | Source | Meaning |
|---|---|---|
| 🔒 **LOCKED** | Archetype DNA in spec | Fixed for this archetype, never changes between generations |
| 🎲 **PICKED** | Variable input pool | Master AI picked one option from a pool defined in the archetype |
| 🏠 **CLIENT** | Client onboarding data | From the client's record (city, brands, photos, etc.) |
| 👁️ **VISION** | Vision pass on photos | A10-only — Master AI analysed an uploaded photo |
| 📝 **COMPOSED** | Judgment call by Master AI | Filled in at composition time, not from spec |

The goal in production is to drive **📝 COMPOSED to zero** — every piece should come from spec or data, not Master AI improvising.

---

## The scenario

- **Archetype:** A1 Energy Bill Hero
- **Client:** new client in Brisbane (any client — using Brisbane to demonstrate)
- **Reference ad:** A03 (locked for A1)
- **Photo attached:** none (A1 doesn't require a client photo)
- **Vision:** not run (no photo)

This is the simplest possible case: just deterministic substitution into the 7-section template.

---

## The inputs

### 🔒 LOCKED (from archetype A1's DNA in `data/archetypes.json`)

| Field | Value | Where it lives |
|---|---|---|
| Reference ad | **A03** ("Cut Your Energy Bills By Up To 30%") | `archetypes.json` → A1 → `exemplar` |
| Funnel stage | **Cold/Warm** | `archetypes.json` → A1 → `funnel_stage` |
| Mood | **Calm, trustworthy, benefit-led** | `archetypes.json` → A1 → `rules[0]` |
| Forbidden | **No pain framing, no aggressive reds** (that's A4's job) | `archetypes.json` → A1 → `rules[2]` |
| Forbidden | **Never fixed price** (only per-week or no price) | `archetypes.json` → A1 → `rules[1]` |
| Layout pattern | **Top-to-bottom flow** | A1's prompt template structure |
| Required clarity | **Headline must reference SAVING / REDUCING / CUTTING bills** | `archetypes.json` → A1 → `rules[2]` |

### 🎲 PICKED (from A1's variable_inputs pools)

For this generation, Master AI picked the following from A1's pools. (Different generation = different picks, gives variety.)

| Field | Picked value | From pool of |
|---|---|---|
| Headline | **"DUCTED A/C THAT PAYS FOR ITSELF"** | 15 options · `variable_inputs.Headlines[4]` |
| Visual hero | **"Person holding up an electricity bill"** | 6 options · `variable_inputs["Visual hero options"][1]` |
| Value stack | **Smart Zoning Technology \| Heat or Cool Just the Rooms You Use \| 5-Year Workmanship Guarantee \| $0 Upfront, Interest-Free Finance Available** | 7 options · `variable_inputs["Value stacks"][3]` |
| CTA | **"GET YOUR FREE QUOTE"** | 8 options · `variable_inputs.CTAs[1]` |
| Badge | **"30% OFF"** | 8 options · `variable_inputs.Badges[2]` |
| Brand count | **3 brands** (multi-brand for savings-led mass-market ad) | pack-balance heuristic |
| Brand logos | **Daikin, MHI, Samsung** | picked from client's `brands_sold` |

### 🏠 CLIENT DATA (from this client's onboarding record)

| Field | Value |
|---|---|
| City | **Brisbane** |
| State | **QLD** |
| Per-week price for Brisbane | **$54** (looked up in `prices.json`) |
| Brands available | Daikin, MHI, Samsung (and others — these 3 picked for this ad) |

### 👁️ VISION

**Not run** — A1 doesn't have a client photo attached. Vision only fires for archetypes with locked client photos: A10 always; A2/A3/A5 conditionally if lifestyle/reaction photos are uploaded.

### 📝 COMPOSED IN THE MOMENT

A few details Master AI filled in that aren't in the spec yet:

- The detailed photo brief: *"middle-aged Australian homeowner standing in a modern home interior, holding up an electricity bill in front of them with a mildly frustrated/concerned expression... natural daytime lighting. Relatable, not too polished, not too gritty."*
- The instruction to make the **dollar amount on the bill prominent and readable**
- The rule "do NOT add any people beyond the bill-holder"

> **🚨 This is the gap that needs to be eliminated before production launch.** Each `visual_hero_option` in the spec needs a **locked photo brief** attached so Master AI just substitutes — no judgment calls. See "What this tells you about the spec" at the bottom.

---

## The composed ChatGPT prompt — line by line

Here's the actual prompt with every line annotated. This is what Master AI emits and what gets sent to ChatGPT Image 2 along with the reference ad image attached as IMAGE 1.

### Section 1 — Image Instructions

> "Use the attached image as a strong style and layout reference. Match its visual energy, density, and direct-response feel — but DO NOT copy its headline, hero visual, or specific colours. Generate fresh ones per the brief below."

- "Attached image" → 🔒 from spec: A1's `reference_ad_id = A03`
- "visual energy, density, direct-response feel" → 🔒 from spec: A1's `mood_category`
- "do not copy" boilerplate → fixed template wording across all archetypes

### Section 2 — Product/Location Framing

> "Create a square 1080×1080 social media ad for a residential ducted air conditioning installer in Brisbane, Australia."

- "1080×1080" → 🔒 hard rule HR10 (always square unless specified)
- "ducted air conditioning installer" → 🔒 product domain (locked across all clients)
- "Brisbane" → 🏠 client data: `client.city`
- "Australia" → 🏠 client data: `client.country`

### Section 3 — Funnel Context

> "FUNNEL CONTEXT: This ad is for a cold/warm audience — buyers researching ways to reduce energy bills. The job is to plant ducted A/C as the savings solution without aggressive urgency. Educational, calm, trustworthy."

- "cold/warm audience" → 🔒 spec: A1's `funnel_stage`
- "researching ways to reduce energy bills" → 🔒 spec: A1's funnel job text
- "without aggressive urgency. Educational, calm, trustworthy" → 🔒 spec: A1's mood + forbidden rules

### Section 4 — Critical Clarity Rule

> "A scroller must understand within ONE SECOND that this ad is for DUCTED AIR CONDITIONING as a way to save on bills."

- The whole sentence → 🔒 global hard rule HR13 + A1's specific clarity emphasis (savings-led)

### Section 5 — Mood & Style

> "MOOD & STYLE — Calm, trustworthy, benefit-led. Choose a fresh modern colour palette of your own — avoid aggressive reds, this is a savings-focused ad, not a pain/urgency ad. Pick clean, modern typography. All text must be high-contrast and readable at thumbnail size. Clean, uncluttered, professional. Don't make it look like a stock template."

- "Calm, trustworthy, benefit-led" → 🔒 spec: A1's `mood_category`
- "Choose a fresh modern colour palette" → 🔒 spec: A1's `palette_strategy = freely_chosen`
- "avoid aggressive reds, this is a savings-focused ad, not a pain/urgency ad" → 🔒 spec: A1's forbidden_elements + differentiation from A4
- "Pick clean, modern typography" → 🔒 spec: A1's `typography_strategy`
- "high-contrast and readable at thumbnail size" → 🔒 hard rule HR11 + HR15
- "Clean, uncluttered, professional" → 🔒 standing instruction across all archetypes

### Section 6 — Layout

> "LAYOUT (top to bottom)"

- "top to bottom" → 🔒 spec: A1's `layout_pattern`

> "1. **HEADLINE** — top third. Oversized bold uppercase text reading exactly: **'DUCTED A/C THAT PAYS FOR ITSELF'**. Split across two lines if needed. Dominant element of the top section."

- "top third" → 🔒 A1's headline placement default
- "Oversized bold uppercase" → 🔒 A1's typography strategy
- The exact text **"DUCTED A/C THAT PAYS FOR ITSELF"** → 🎲 PICKED from `variable_inputs.Headlines[4]`
- "Split across two lines" → 🔒 standard typography for long headlines

> "2. **HERO VISUAL** — middle, roughly 45% of canvas height. A photo-real middle-aged Australian homeowner standing in a modern home interior, holding up an electricity bill in front of them with a mildly frustrated/concerned expression. The bill should look real and readable but not show specific identifying details — show large dollar amounts on it. Natural daytime lighting. Relatable, not too polished, not too gritty."

- "middle, roughly 45% of canvas height" → 🔒 A1's hero placement default
- The visual choice "person holding bill" → 🎲 PICKED from `variable_inputs["Visual hero options"][1]`
- The detailed photo brief ("middle-aged Australian homeowner... daytime lighting... relatable not gritty") → 📝 COMPOSED **(should be locked in spec)**

> "3. **PRICE PILL** — just below the hero. A horizontal pill-shaped panel containing three lines of text, vertically stacked: Small uppercase caps: 'DUCTED A/C INSTALLED FOR' / Oversized bold dominant: **'$54'** / Small uppercase caps: 'PER WEEK'."

- "horizontal pill-shaped panel" → 🔒 A1's `price_treatment.shape`
- "DUCTED A/C INSTALLED FOR" / "PER WEEK" → 🔒 standard per-week treatment
- **"$54"** → 🏠 client data: `prices[Brisbane].perWeek`

> "4. **VALUE STACK** — right of (or beneath) the price pill. Four tick-bullet items, evenly spaced: ✓ Smart Zoning Technology / ✓ Heat or Cool Just the Rooms You Use / ✓ 5-Year Workmanship Guarantee / ✓ $0 Upfront, Interest-Free Finance Available."

- "right of (or beneath) the price pill" → 🔒 A1's value-stack placement default
- The 4 specific bullets → 🎲 PICKED from `variable_inputs["Value stacks"][3]`

> "5. **CTA BUTTON** — bottom-left. Rounded pill button reading: **'GET YOUR FREE QUOTE'**. Clean uppercase. High-contrast colour."

- "bottom-left" → 🔒 A1's CTA placement default
- **"GET YOUR FREE QUOTE"** → 🎲 PICKED from `variable_inputs.CTAs[1]`

> "6. **DISCOUNT BADGE** — top-right or bottom-right corner. Circular burst badge reading: **'30% OFF'**. Bold contrasting colour."

- "top-right or bottom-right" → 🔒 A1's badge placement options
- **"30% OFF"** → 🎲 PICKED from `variable_inputs.Badges[2]`

> "7. **BRAND STRIP** — very bottom edge. Thin horizontal strip with three brand logos evenly spaced: Daikin, Mitsubishi Heavy Industries, Samsung."

- "very bottom edge" → 🔒 standard brand strip placement
- "three brand logos" → 🎲 pack-balance picked 3 (vs. 2 for premium)
- "Daikin, MHI, Samsung" → 🎲 picked from 🏠 client's `brands_sold`

### Section 7 — Hard Rules

> - 1080×1080 aspect ratio (square), nothing else → 🔒 HR10
> - All text must be readable at thumbnail size on a phone → 🔒 HR15
> - Maximum 3 brand logos → 🔒 HR05
> - Do NOT add "0% interest" anywhere — interest-free finance is fine → 🔒 HR01
> - Do NOT add a fixed-price installation amount → 🔒 A1's forbidden_elements
> - Do NOT add any people beyond the bill-holder → 📝 COMPOSED **(should be locked in spec)**
> - Do NOT add review badges or star ratings → 🔒 A1's forbidden_elements

---

## Source breakdown

| Source | % of prompt content |
|---|---|
| 🔒 LOCKED from archetype DNA | ~60% |
| 🎲 PICKED from variable_inputs pools | ~25% |
| 🏠 CLIENT DATA | ~5% |
| 📝 COMPOSED in the moment | **~10%** ← the gap to eliminate |

The 60/25/5 portion is **deterministic** — same inputs always produce the same prompt. That's good; that's the design.

The 10% COMPOSED portion is **non-deterministic** — Master AI is making judgment calls every generation. That's bad; different generations could produce different quality.

---

## What this tells you about the spec

The 10% COMPOSED gap should be eliminated. Each `visual_hero_option` in the spec needs a **locked photo brief** attached, so Master AI's job becomes pure substitution — no judgment.

Currently the spec has visual hero options as bare strings:

```json
"Visual hero options": [
  "3D house diagram with airflow arrows",
  "Person holding up an electricity bill",
  "Bill graphic with downward arrow showing savings",
  ...
]
```

What it SHOULD have, eventually:

```json
"visual_hero_options": [
  {
    "key": "house_diagram",
    "label": "3D house diagram with airflow arrows",
    "locked_photo_brief": "Clean isometric 3D rendering of a single-storey home cutaway, showing internal ducting and outlets. Cool blue-and-white palette. No people. ~45% of canvas height, centred.",
    "forbidden_elements": ["no people in the hero"]
  },
  {
    "key": "bill_holder",
    "label": "Person holding up an electricity bill",
    "locked_photo_brief": "Photo-real middle-aged Australian homeowner standing in a modern home interior, holding up an electricity bill in front of them with a mildly frustrated/concerned expression. Bill looks real and readable but no specific identifying details — show large dollar amounts on it. Natural daytime lighting. Relatable, not too polished, not too gritty.",
    "forbidden_elements": ["no other people beyond the bill-holder"]
  },
  ...
]
```

Then in production, when Master AI picks `bill_holder`, it just substitutes the locked photo brief into the prompt's hero section. No improvising.

This work — going through each archetype's variable_inputs pools and writing locked photo briefs / placement specs / forbidden_elements lists for every variant — is the spec-deepening pass that eliminates the 10% drift. **It's a recommended task for the tech guy phase**, after the basic system is wired up.

---

## How to read this for your own archetype

Same pattern works for any archetype:

1. Look up the archetype's DNA in `data/archetypes.json` → that's your 🔒 LOCKED layer
2. Check what pools the archetype has (Headlines, Value stacks, CTAs, Badges, Visual hero options) → those are 🎲 PICKED at composition time
3. Pull the client record for substitution values (city, brands, photos, reviews) → 🏠 CLIENT
4. For A10 only: run vision on the client's team/owner/van photo → 👁️ VISION
5. Look at the 8 worked gold standards in `docs/05_GOLD_STANDARDS/` for examples of what the final prompt looks like in each case

The 7-section template is the same for all 10 archetypes — only the slot fillings change.
