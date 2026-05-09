# Input → Section Mapping

> Every input field, mapped to where it lands in the composed ChatGPT prompt. This is what Layer 2 codes against. Read [THE_PROMPT_ENGINE.md](THE_PROMPT_ENGINE.md) first for the conceptual model — this is the implementation table.

---

## The 7 sections of every prompt

Every prompt Layer 2 emits has these sections in this order. Section numbers are **stable** — anchor your code to them.

```
SECTION 1: ATTACHED IMAGE INSTRUCTIONS
SECTION 2: PRODUCT/LOCATION FRAMING
SECTION 3: FUNNEL CONTEXT
SECTION 4: CRITICAL CLARITY RULE
SECTION 5: MOOD & STYLE (vision-rewritten if photos attached)
SECTION 6: LAYOUT (numbered sub-sections)
SECTION 7: GLOBAL HARD RULES
```

---

## Input-to-section map

| Input field | Source layer | Lands in section | How it's used |
|---|---|---|---|
| `archetype.reference_ad_id` | A (DNA) | §1 IMAGE 1 | "Use this as a strong style and layout reference. Match its [archetype.mood_short] feel..." |
| `archetype.locked_component_slots` | A (DNA) | §1 IMAGE 2/3/... | One paragraph per locked component. Always with "use AS PROVIDED, do not modify..." |
| `archetype.layout_pattern` | A (DNA) | §6 structure | Determines if §6 uses "top to bottom" numbering, "left half / right half split", or "photo-led full-canvas" |
| `archetype.mood_category` | A (DNA) | §5 first sentence | "Aggressive, direct-response, unmissable" / "Refined, sophisticated, aspirational" / "Visceral. Hot. Uncomfortable, then resolved." |
| `archetype.palette_strategy` | A (DNA) | §5 palette guidance | If `derived_from_photo`: §5 is REWRITTEN using vision output (Layer D). Otherwise: "Choose a fresh [adjective] palette of your own..." |
| `archetype.typography_strategy` | A (DNA) | §5 + §6 headline section | "Pick clean modern typography..." or "italic serif works beautifully for [hero word]" |
| `archetype.brand_count_rule` | A (DNA) → manifest | §6 brand strip + §7 hard rule | "Maximum N brand logos" + brand strip subsection |
| `archetype.mandatory_elements[]` | A (DNA) | §7 hard rules | "[element] is MANDATORY" |
| `archetype.forbidden_elements[]` | A (DNA) | §7 hard rules | "Do NOT add [element]" |
| `archetype.clarity_rule_emphasis` | A (DNA) | §4 | Adds archetype-specific clarity demand to standard clarity rule |
| `archetype.funnel_stage` | A (DNA) | §3 first sentence | "This ad is for a {funnel_stage} audience..." |
| `archetype.funnel_job_text` | A (DNA) | §3 body | The "what job does this ad do" paragraph |
| | | | |
| `client.business_name` | B (Onboard) | §2 (if A10/trust) | "Create a square 1080×1080 social media ad for **{business_name}**, a residential ducted A/C installer..." |
| `client.city` | B (Onboard) | §2 + §6 geo banner + §7 hard rule | "...installer in **{city}**, Australia." + geo banner content + "PERTH must appear in the top banner" |
| `client.region` | B (Onboard) | §6 geo banner (A10) | "CENTRAL COAST · NEWCASTLE · HUNTER VALLEY" |
| `client.years_in_business` | B (Onboard) | §6 sub-headline (A10) | "trusted locally since {2025 - years_in_business}" |
| `client.google_review_count` | B (Onboard) | §6 trust badge + value stack | "168+ 5-STAR REVIEWS" |
| `client.brands_sold[]` | B (Onboard) → manifest brand_logos_pick | §6 brand strip | Subset of brands picked by Layer 1 |
| `client.install_guarantee_days` | B (Onboard) | §6 headline + sub-headline (A2) | Substituted into "{install_guarantee_days}" placeholders |
| `client.current_promo_pct` | B (Onboard) | §6 discount badge (A6/A8) | Substituted into "{current_promo_pct} OFF" |
| `client.assets[]` | B (Onboard) | §1 + §6 photo subsection | Becomes IMAGE 2/3 + the "use this for the X-half hero" instruction |
| | | | |
| `manifest.headline_pick` | C (Variable) | §6 headline subsection | The exact headline string + typographic treatment |
| `manifest.sub_headline_pick` | C (Variable) | §6 sub-headline subsection | Italic accent text |
| `manifest.value_stack_pick` | C (Variable) | §6 value stack subsection | Tick-bullet list (split on `\|` separator) |
| `manifest.cta_pick` | C (Variable) | §6 CTA button subsection | Pill button text |
| `manifest.badge_pick` | C (Variable) | §6 badge subsection | Circular/burst badge text |
| `manifest.per_week_price` | C (Variable) | §6 price pill subsection | "$58" oversized in price pill |
| `manifest.fixed_price` (if archetype) | C (Variable) | §6 price block | "$5,799" + struck-through anchor |
| | | | |
| `vision.dominant_colours[]` | D (Vision) | §5 PALETTE block | Replaces default palette guidance with photo-derived palette |
| `vision.branded_text_to_preserve[]` | D (Vision) | §1 IMAGE instructions + §7 hard rules | "do not crop out '{text}'" |
| `vision.negative_space` | D (Vision) | §6 headline placement | "headline sits in the {area} where there is no person" |
| `vision.lighting_warmth` | D (Vision) | §5 mood adjustment | "warm afternoon" → "warm, locally rooted feel" |
| `vision.composition_recommendation` | D (Vision) | §6 layout decision | Can override default split-screen → photo-led full-canvas |
| | | | |
| `manifest.brand_count_pick` | E (Pack) | §6 brand strip + §7 hard rule | Final brand count after pack-balance adjustment |
| `manifest.price_treatment` | E (Pack) | §6 price section | "no-price premium variant" / "per-week" / "fixed + anchor" |

---

## Section-by-section template (with placeholder syntax)

Below is the literal template Layer 2 instantiates. `{double_brace}` = substitution from inputs above. `[bracketed]` = conditional block.

### Section 1 — Attached Image Instructions

```
You are being given {n_images} attached images:

IMAGE 1 (reference ad): Use this as a strong style and layout reference. Match its {archetype.mood_short} feel{archetype.match_specifics_sentence_fragment} — but DO NOT copy its headline, {archetype.dont_copy_list}, or specific colours. Generate fresh ones per the brief below.

[For each locked_component in archetype.locked_component_slots:]
IMAGE {n} ({component.role_name} — {component.description}): Use this image AS PROVIDED for the {component.placement}. {component.preservation_instruction} {vision.branded_text_preservation_clause if photo}
```

### Section 2 — Product/Location Framing (one sentence)

```
Create a square 1080×1080 social media ad for {client.business_name_clause}a residential ducted air conditioning installer in {client.city_or_region}, Australia.
```

### Section 3 — Funnel Context (one paragraph)

```
FUNNEL CONTEXT
This ad is for a {archetype.funnel_stage} audience{archetype.audience_qualifier}. {archetype.funnel_job_text}
```

### Section 4 — Critical Clarity Rule (always)

```
CRITICAL CLARITY RULE
A scroller must understand within ONE SECOND that this ad is for DUCTED AIR CONDITIONING{archetype.clarity_addendum}. {archetype.clarity_emphasis}
```

### Section 5 — Mood & Style (vision-rewritten if photos)

**If `archetype.palette_strategy != 'derived_from_photo'`:**

```
MOOD & STYLE
{archetype.mood_paragraph}. Choose a fresh {archetype.palette_adjective} colour palette of your own — {archetype.palette_examples}. {archetype.typography_paragraph}. All text must be readable at thumbnail size on a phone. {archetype.feel_clause}
```

**If `archetype.palette_strategy == 'derived_from_photo'`:**

```
PALETTE — DRIVEN BY THE PHOTO ITSELF
This ad's palette is dictated by {client.business_name}'s actual brand identity visible in the photo:
[For each colour in vision.dominant_colours]
- {colour.name.upper()} ({colour.where}) — use this {colour.role}

The ad should feel like an EXTENSION of {client.business_name}'s brand, not a generic template with their photo dropped in.
```

### Section 6 — Layout (archetype-specific structure)

Layer 2 picks the layout block based on `archetype.layout_pattern`:

- **`top_to_bottom`** (A4, A7) → numbered subsections 1, 2, 3, ... flowing top to bottom
- **`left_right_split`** (A1, A2-cold, A3, A5) → "LEFT HALF" / "RIGHT HALF" headers with subsections under each
- **`full_bleed_photo`** (A2-warm) → "FULL-BLEED BACKGROUND" + overlay subsections
- **`photo_led_full_canvas`** (A10) → photo as base layer, text elements integrated into specific zones identified by vision

Within each layout, the same subsection types appear in archetype-determined order:
- HEADLINE — placement + typographic treatment from `manifest.headline_pick` + `archetype.typography_strategy`
- SUB-HEADLINE — from `manifest.sub_headline_pick`
- HERO VISUAL — placement + size + treatment of the locked component or photo
- PRICE BLOCK / PILL — from `manifest.per_week_price` (or omitted for premium variant)
- VALUE STACK — tick-bullets parsed from `manifest.value_stack_pick`
- CTA BUTTON — from `manifest.cta_pick` + style hint
- BADGE — from `manifest.badge_pick` + position from DNA
- BRAND STRIP — from `manifest.brand_logos_pick`

### Section 7 — Global Hard Rules (bulleted)

```
GLOBAL HARD RULES
- 1080×1080 aspect ratio (square), nothing else
- Use the {photo_role} photo (IMAGE {n}) AS PROVIDED — do not modify {vision.preservation_list_clause}
- Maintain ~60px safe-zone padding inside all four edges
- All text readable at thumbnail size on mobile
- Maximum {manifest.brand_count_pick} brand logos
[For each rule in GLOBAL_17_HARD_RULES if applicable to archetype:]
- {rule}
[For each item in archetype.forbidden_elements:]
- Do NOT add {item}
[For each item in archetype.mandatory_elements:]
- {item} is MANDATORY — without it, the ad fails
[If photos attached:]
- The product category "DUCTED A/C" / "DUCTED AIR CONDITIONING" must be unmissable in the headline
[For each preservation_rule in vision.preservation_rules:]
- {preservation_rule}
```

---

## Implementation pseudocode

Here's how Layer 2's main function looks in pseudocode:

```python
def compose_prompt(manifest_entry, attachments, client_data, spec):
    # Layer A: Read archetype DNA
    archetype = spec.archetypes[manifest_entry.archetype]
    
    # Layer B already in client_data
    # Layer C already in manifest_entry (picks)
    # Layer E already in manifest_entry (pack-balance)
    
    # Layer D: Vision analysis (only if photos attached)
    vision_brief = None
    photo_attachments = [a for a in attachments if a.role == 'client_locked' and a.media_type.startswith('image/')]
    if photo_attachments:
        vision_brief = run_vision_analysis(photo_attachments, archetype, client_data)
    
    # Compose 7 sections using template
    section_1 = render_image_instructions(attachments, archetype, vision_brief)
    section_2 = render_framing(archetype, client_data)
    section_3 = render_funnel_context(archetype)
    section_4 = render_clarity_rule(archetype)
    section_5 = render_mood_style(archetype, vision_brief, client_data)
    section_6 = render_layout(archetype, manifest_entry, vision_brief)
    section_7 = render_hard_rules(archetype, manifest_entry, vision_brief)
    
    return "\n\n".join([section_1, section_2, section_3, section_4, section_5, section_6, section_7])
```

The whole engine is template substitution + one vision call. No improvisation, no chat history, no human in the loop.

---

## Why this is reliable

The procedure is reliable because **all the creative decisions were made once, when designing the archetype DNA and the variable_inputs pools.** Once those are locked, every subsequent prompt is deterministic from inputs.

When the archetype DNA was created, the work was:
- Looked at the historical reference ad
- Identified the visual signature (what makes A7 feel like A7)
- Captured the mandatory elements, forbidden elements, layout pattern, mood
- Wrote 10-15 headline variants that all preserve the archetype's voice
- Wrote 5-7 value stack variants
- Wrote 6-8 CTA and badge variants

That work was creative. Composing the prompt from those locked inputs is mechanical.

The vision pass adds one final layer of personalisation per client, but it's a structured information extraction task, not a creative one — Claude looks at the photo, extracts the listed fields, and Layer 2 substitutes them into the template.

This is why the system can run "fresh from data" without chat context. The chat is where the DNA was designed. Once it's in the spec, it never needs to be designed again — only applied.
