# Tradie Force — Ad Generation Prompt Templates

Companion to `tradie_force_ad_library.xlsx`. Each archetype below = one prompt template that gets fed into Nano Banana (via ChatGPT image gen) along with the relevant component images from the library. Output is a mockup for AJ's team to rebuild in Canva.

---

## How this works

1. New client signs on → onboarding form captures inputs (see schema below).
2. Pack Selection logic (xlsx Sheet 4) picks which archetypes fire for this client.
3. For each fired archetype, the system fills the prompt template's `{{placeholders}}` with the client's inputs.
4. The system attaches the relevant component reference images from the library.
5. The HARD RULES block (below) gets prepended to every prompt automatically.
6. Nano Banana generates a mockup → AJ's team rebuilds in Canva for production.

---

## Input schema (from the onboarding form)

These are the variables the prompts pull from. Each prompt only uses the subset it needs.

| Variable | Source | Example |
|---|---|---|
| `{{business_name}}` | Form | Aura Air Brisbane |
| `{{city}}` | Form | Sydney |
| `{{region}}` | Form | Far North Coast |
| `{{per_week_price}}` | Healthy Price Library, keyed by city | $59/week |
| `{{fixed_price}}` | Healthy Price Library, keyed by city | $9,990 |
| `{{anchor_price}}` | Healthy Price Library, keyed by city | $16,490 |
| `{{discount_pct}}` | Auto-calc from anchor vs fixed | 39% |
| `{{brand_1}}, {{brand_2}}, {{brand_3}}` | Form (max 3) | Daikin, Mitsubishi Heavy Industries, Samsung |
| `{{install_guarantee_days}}` | Form | 7 days |
| `{{google_review_count}}` | Form | 168 |
| `{{team_photo}}` | Form upload | (image attached) |
| `{{owner_photo}}` | Form upload | (image attached) |
| `{{van_photo}}` | Form upload | (image attached) |
| `{{season}}` | Auto from current month + hemisphere | Winter (Southern Hemisphere) |
| `{{current_promo_pct}}` | Form (when promo active) | 30% |
| `{{holiday_name}}` | Auto from calendar | Black Friday |

---

## HARD RULES BLOCK (prepended to every prompt)

```
HARD RULES — these override anything else in the prompt:

1. NEVER include the text "0% interest" anywhere on the ad. "$0 upfront" and 
   "interest-free finance available" are acceptable; the exact phrase "0% interest" 
   is not.

2. Use the attached technical component images (condensers, outlets, ducting, 
   controllers, house diagrams) EXACTLY as provided. Do not regenerate, redraw, 
   or stylistically modify them. Place them, scale them, and composite them — but 
   never recreate them.

3. Condenser units shown must be the double-fan ducted version (two stacked fans). 
   Single-fan units are split systems and are the wrong product. If unsure, omit 
   the condenser.

4. Maximum 3 brand logos in the brand strip at the bottom. No company logo for 
   the advertising business itself anywhere on the creative.

5. Do not generate human faces with AI. Use the supplied stock or client-provided 
   photos exactly as attached.

6. All pricing shown must match the variables provided. Do not invent prices, 
   discounts, or savings figures.

7. Output a square 1080×1080 image suitable for Meta feed placement, unless 
   otherwise specified.

8. Headline text must be highly legible — bold sans-serif, high contrast against 
   background, large enough to read on a phone screen at thumbnail size.
```

This block is injected automatically. The prompts below assume it's already in place.

---

# Archetype 1 — Energy Bill Hero

**When to use:** Always. Universal best performer.

**Inputs:** `{{per_week_price}}`, `{{brand_1}}, {{brand_2}}, {{brand_3}}`

**Reference ad:** A01

**Component attachments:** House diagram (whole-home, 3D isometric, blue tones from library)

```
Create a square 1080×1080 social media ad for a residential ducted air conditioning 
installer.

LAYOUT:
- Top third: bold headline reading "CUT YOUR ENERGY BILLS BY UP TO 30%" in white 
  uppercase sans-serif, set against a clean medium-blue background.
- Middle: place the attached house-diagram image centred, large, occupying 
  roughly 50% of the canvas height. Do not modify the diagram.
- Below the diagram: a clean white pill-shaped panel containing the text 
  "DUCTED A/C INSTALLED FOR" (small caps, dark grey) above "{{per_week_price}}" 
  in large bold dark blue, with "PER WEEK" beneath in small caps.
- Bottom strip: thin white band with the brand logos {{brand_1}}, {{brand_2}}, 
  {{brand_3}} evenly spaced. Logos in their native colours.

STYLE:
- Palette: medium blue background, white headline, dark blue accents.
- No people, no decorative imagery beyond the diagram.
- Clean, premium, uncluttered. The diagram and the price pill do all the 
  visual work.

TONE: Authoritative, benefit-led, frictionless.
```

---

# Archetype 2 — Speed Guarantee

**When to use:** Always, unless client install lead times exceed 2 weeks.

**Inputs:** `{{install_guarantee_days}}`, `{{per_week_price}}`

**Reference ad:** A02

**Component attachments:** Stock family lifestyle photo (warm, natural, mid-shot from library)

```
Create a square 1080×1080 social media ad for a residential ducted air 
conditioning installer.

LAYOUT:
- Background: place the attached family lifestyle photo as the full-bleed 
  background. Apply a subtle blue tint overlay (15–20% opacity) so headline 
  text remains legible.
- Top-left third: stacked headline reading "Get your Ducted A/C in just 
  {{install_guarantee_days}}!" — "Get your Ducted A/C in just" in medium 
  weight white, "{{install_guarantee_days}}!" in oversized bold white.
- Top-right corner: circular badge reading "FASTEST INSTALL GUARANTEED" 
  in red and white, slightly tilted.
- Lower-left: subhead "Enjoy a cool, comfortable home without the wait." 
  in white serif italic.
- Lower-right: white pill panel with "{{per_week_price}}" in large bold 
  dark blue, "PER WEEK" beneath in small caps. Beneath the pill, three small 
  white tick-bullets reading: "$0 upfront, no hidden fees" / "Interest-free 
  finance available" / "Guaranteed installation within {{install_guarantee_days}}".

STYLE:
- Palette: warm photo background + blue tint + white text + red guarantee badge.
- Family must look natural and unposed. Use the supplied photo exactly — do 
  not regenerate or modify the people.

TONE: Warm, trustworthy, urgent on speed.
```

---

# Archetype 3 — Luxury Lifestyle

**When to use:** Always when client has online presence (active IG/website) OR target market is premium suburbs. Default per-week version. Generate fixed-price variant only if Slot 7 (Problem/Solution Urgency) is unfilled.

**Inputs:** `{{per_week_price}}`, optionally `{{fixed_price}}` and `{{anchor_price}}`, `{{brand_1}}, {{brand_2}}, {{brand_3}}`

**Reference ads:** A03 (per-week, no price), A04/A05 (fixed price)

**Component attachments:** Stock family-on-couch lifestyle photo (premium, modern interior, from library)

```
Create a square 1080×1080 premium-positioned social media ad for a residential 
ducted air conditioning installer.

LAYOUT:
- Background: medium blue gradient.
- Left half: stacked headline reading "LUXURY HEATING FOR EVERY ROOM!" 
  (or "LUXURY COOLING" depending on season). "LUXURY" in white serif italic, 
  "HEATING" or "COOLING" in oversized bold white sans-serif. Beneath: 
  "DUCTED A/C INSTALLED FOR ONLY" in small white caps, then 
  "{{per_week_price}}" in oversized bold white. (If using the fixed-price 
  variant, replace with "{{fixed_price}}" and show "{{anchor_price}}" 
  struck through above it in smaller red text.)
- Right half: place the attached family-on-couch lifestyle image full-height 
  with the right edge bleeding off the canvas.
- Subtle airflow-vector arrows in light blue radiating from a small ceiling 
  vent icon above the family.
- Five small white-tick benefit bullets stacked along the lower-left:
  - Silent, Seamless, and Smart Cooling
  - Zoned Control for Maximum Comfort
  - 5-Year Workmanship Guarantee + Free Rust Protection
  - $0 Upfront, Interest-Free Finance Available
  - Limited Slots — Upgrade Your Home Today!
- Bottom-left red CTA button: "Upgrade Your Home Today!" in white.
- Bottom-right circular discount badge (only if using fixed-price variant): 
  "{{discount_pct}} OFF" in white on red.
- Bottom strip: brand logos {{brand_1}}, {{brand_2}}, {{brand_3}} on 
  white band.

STYLE:
- Palette: medium blue + white + red CTA accent.
- Premium and clean. The lifestyle photo carries the emotional weight.

TONE: Aspirational, premium, family-focused.
```

---

# Archetype 4 — Problem/Solution Urgency (FIXED PRICE)

**When to use:** ONE PER CLIENT MAX. Only when `{{city}}` exists in the Healthy Price Library AND the client market is price-sensitive / cooler. Skip entirely otherwise.

**Inputs:** `{{fixed_price}}`, `{{anchor_price}}`, `{{discount_pct}}`, `{{brand_1}}, {{brand_2}}, {{brand_3}}`

**Reference ad:** A07

**Component attachments:** House diagram (whole-home, 3D isometric, neutral or dark variant from library)

```
Create a square 1080×1080 high-urgency direct-response social media ad for a 
residential ducted air conditioning installer.

LAYOUT:
- Background: deep black with subtle electric/neon purple energy lines 
  radiating from behind the centred component (suggesting power / energy 
  cost / heat).
- Top: headline "SICK OF" in white sans-serif followed by "HIGH ENERGY BILLS?" 
  in oversized bold yellow uppercase. Set as two stacked lines, left-aligned.
- Centre: place the attached house-diagram image. Do not modify it.
- Right side (mid): vertical red panel with white text reading "THE SOLUTION:" 
  (small caps), then "DUCTED A/C INSTALLED FOR" (small white caps), then 
  "{{fixed_price}}" in oversized bold white. Above the price, "{{anchor_price}}" 
  struck through in smaller text.
- Below the price block: red rounded button "REQUEST A FREE QUOTE TODAY!" 
  in bold white.
- Bottom-left circular badge: "{{discount_pct}} OFF" in white on red, slightly 
  tilted.
- Bottom strip: brand logos {{brand_1}}, {{brand_2}}, {{brand_3}} on dark band.

STYLE:
- Palette: black background + neon purple accents + red CTA + yellow headline + 
  white body. High-contrast, aggressive.
- This is the "shock and convert" ad. Visual urgency is the point.

TONE: Punchy, problem-aware, no-nonsense direct response.
```

---

# Archetype 5 — Seasonal Pain

**When to use:** Always, auto-rotated. Summer version (`Don't Melt`) runs Nov–Mar SH / May–Sep NH. Winter version (`Don't Freeze`) runs May–Sep SH / Nov–Mar NH. Use shoulder-season variant during transitions.

**Inputs:** `{{per_week_price}}`, `{{season}}`

**Reference ads:** A08 (summer), A09 (winter)

**Component attachments:** Reaction-face stock photo (sweating man for summer, freezing family for winter — from library); house diagram

```
Create a square 1080×1080 social media ad for a residential ducted air 
conditioning installer using a season-appropriate emotional pain hook.

LAYOUT:
- Background: warm coral/red for summer variant, cool slate for winter variant. 
  Decorative floral or snowflake border elements depending on season.
- Top headline (large, white, uppercase, bold sans-serif): 
  - Summer: "Don't MELT This Summer!"  ("MELT" oversized in red/yellow)
  - Winter: "Don't FREEZE This Winter!"  ("FREEZE" oversized in icy blue)
- Left half: place the attached reaction-face photo full-height. Person's 
  expression must clearly read as the relevant seasonal discomfort.
- Right half: white pill panel with "DUCTED A/C INSTALLED FOR" (small caps), 
  "{{per_week_price}}" in oversized bold dark text, "PER WEEK" small caps 
  beneath.
- Beneath the pill: small reassurance line "$1,299 in FREE Bonuses" or 
  similar — kept short.
- Below the photo: house diagram component centred, smaller scale.
- Bottom-left circular badge: "50% OFF" in white on red.

STYLE:
- Palette: high-saturation seasonal background + white text + bold typography.
- Reaction-face is the scroll-stopper. Don't crowd it with other elements.

TONE: Visceral, emotional, immediate.
```

---

# Archetype 6 — Seasonal Sale Event

**When to use:** During seasonal transition windows (autumn → winter, spring → summer) AND when client is running a real promo with a defined `{{current_promo_pct}}`.

**Inputs:** `{{per_week_price}}` OR `{{fixed_price}}`+`{{anchor_price}}`, `{{current_promo_pct}}`, `{{season}}`

**Reference ads:** A10–A15

**Component attachments:** Reaction-model photo (woman pointing up, neutral expression, from library); condenser unit OR house diagram

```
Create a square 1080×1080 seasonal-sale social media ad for a residential 
ducted air conditioning installer.

LAYOUT:
- Background: 
  - Winter Sale: blue/sky with subtle snow particles
  - Autumn Sale: pale blue with floral border elements  
  - Heatwave/40° variant: purple/lavender with sun-ray motif
- Top headline (oversized white uppercase bold): "{{season}} SALE" or 
  "BEAT THE 40° DAYS" (use the closest seasonal anchor for the current month).
- Centre-left: place the attached reaction-model image with one hand pointing 
  upward toward the price block.
- Centre-right: white pill panel with "DUCTED A/C INSTALLED FOR" (small caps), 
  "{{per_week_price}}" or "{{fixed_price}}" in oversized bold dark text.
- Beneath the pill: 4 small tick-bullets in white on coloured background:
  - Energy Efficient Heating & Cooling
  - Zoned Control for Maximum Comfort
  - $0 Upfront Cost
  - Interest-Free Finance Available
- Top-right corner: circular badge "{{current_promo_pct}} OFF" in white on red.
- Component (condenser or house diagram) tucked into the lower-left or 
  lower-right corner, smaller scale.

STYLE:
- Palette: season-appropriate background + high-contrast white headline + 
  red discount badge.
- Discount badge must visually anchor the eye after the headline.

TONE: Promotional, seasonally-relevant, action-oriented.
```

---

# Archetype 7 — City Massive Sale

**When to use:** Always for clients needing volume / with limited online presence. Default for new aggressive accounts.

**Inputs:** `{{city}}`, `{{per_week_price}}`, optionally `{{brand_1}}`, optionally `{{discount_pct}}`

**Reference ads:** A19–A31

**Component attachments:** Large condenser image (double-fan, library); optionally house diagram for zoning variants

```
Create a square 1080×1080 high-impact direct-response social media ad for a 
residential ducted air conditioning installer in {{city}}.

LAYOUT:
- Background: deep navy blue, full-bleed.
- Top banner: "{{city}} HOMEOWNERS" in white small caps across the top.
- Headline beneath: "DUCTED A/C SALE" (or "DUCTED A/CON MASSIVE SALE" / 
  "DUCTED A/C WITH ZONING" depending on variant) in oversized bold white 
  uppercase. The word "SALE" or the key noun is set in red.
- Sub-headline: "10kW {{brand_1}} Ducted System" in white small caps 
  (omit brand if not specified).
- Right side: place the attached condenser image (double-fan ducted unit) 
  large, occupying ~40% of canvas. Do not modify.
- Left side, lower: large white "FROM" label, then "{{per_week_price}}" in 
  oversized bold white slanted slightly. Beneath: "/WEEK" in red.
- Bottom-left footer: red badge "ZERO UPFRONT" with a dollar-sign icon.
- Bottom-right footer: red badge "LOCALLY INSTALLED BY {{city}} EXPERTS" 
  with a location-pin icon.
- Optional top-right corner: yellow burst badge "{{discount_pct}} OFF" if 
  discount applies.

STYLE:
- Palette: deep navy + red accents + white type. High-contrast, aggressive.
- Condenser is the hero visual. Headline carries the message.

TONE: Direct, volume-driven, no-nonsense.
```

---

# Archetype 8 — Localized Clearance

**When to use:** When client is running a clearance / EOFY / EOQ promo AND `{{city}}` exists in Healthy Price Library. Use sparingly — fatigue risk.

**Inputs:** `{{city}}`, `{{fixed_price}}`, `{{discount_pct}}`, `{{brand_1}}, {{brand_2}}, {{brand_3}}`

**Reference ads:** A16, A17, A18

**Component attachments:** House diagram (small, library)

```
Create a square 1080×1080 plain-style clearance social media ad for a 
residential ducted air conditioning installer.

LAYOUT:
- Background: clean light blue (or white with blue accent strip down the side).
- Top: small location pill with map-pin icon: "{{city}}" in white on dark blue.
- Headline beneath, two stacked lines: "{{city}} DUCTED A/C SALE" (or 
  "DUCTED A/C CLEARANCE SALE!") in dark navy bold uppercase.
- Centre-left: place the attached house-diagram image, medium scale.
- Centre-right: large bold dark text "{{fixed_price}}" with subtext beneath 
  reading "Save on your Power Bills" or "Energy Efficient — Save on electricity".
- Bottom-left: small badge "0% INTEREST $0 UPFRONT" — REPLACE THIS WITH 
  "INTEREST-FREE FINANCE, $0 UPFRONT" per hard rule #1.
- Bottom-right corner: circular yellow/red badge "{{discount_pct}} OFF" 
  or "50%".
- Bottom strip: brand logos {{brand_1}}, {{brand_2}}, {{brand_3}}.

STYLE:
- Palette: light/clean. Less aggressive than Archetype 7. Wider visual breathing 
  room.

TONE: Straightforward, clearance-positioning, low-pressure.
```

---

# Archetype 9 — Holiday Event

**When to use:** Within 14 days of a major retail holiday only. Auto-pause after the date.

**Inputs:** `{{holiday_name}}`, `{{discount_pct}}` OR `{{per_week_price}}`

**Reference ads:** A32 (Black Friday — heavy), A33 (Black Friday — clean per-week)

**Component attachments:** Outlet (close-up) OR condenser unit (depending on variant); optionally tradesman portrait from library

```
Create a square 1080×1080 holiday-event social media ad for a residential 
ducted air conditioning installer.

LAYOUT (heavy variant):
- Background: black + red banner across upper third.
- Banner contains: "{{holiday_name}}" in oversized bold white sans-serif 
  (e.g. "BLACK FRIDAY"). Set the holiday name as the dominant visual.
- Beneath the banner: "DISCOUNT UP TO {{discount_pct}}" in white on black.
- Centre-right: tradesman portrait (thumbs-up pose, attached) — use as-is, 
  do not regenerate.
- Bottom-left: red rounded button "GET QUOTE" in white.
- Bottom strip: small brand logos.

LAYOUT (clean per-week variant):
- Background: light blue.
- Top banner: white text on red strip "{{holiday_name}} SALE" with 
  "{{discount_pct}} OFF" circular badge top-left.
- Centre: large condenser image, medium scale.
- Right of condenser: stacked text "DUCTED A/C INSTALLED FROM" then 
  "{{per_week_price}}" in oversized bold dark navy.
- Beneath: short urgency line "BEAT THE SUMMER RUSH!" or season-appropriate 
  variant.
- Bottom: micro-disclaimer line "Save up to 50% on energy bills | $0 upfront, 
  interest-free finance available | Limited slots while stock lasts!"

STYLE:
- Choose heavy variant for high-discount aggressive promos. Choose clean 
  per-week for finance-led promos.
- Holiday name is always the dominant visual element.

TONE: Time-bound urgency. Calendar-driven scarcity.
```

---

# Archetype 10 — Local Trust / Expert

**When to use:** GATED. Client must have ≥30 Google reviews AND at least one of: team photo, owner photo, or van photo.

**Inputs:** `{{region}}` or `{{city}}`, `{{google_review_count}}`, `{{per_week_price}}` (optional), photo upload (`{{team_photo}}` / `{{owner_photo}}` / `{{van_photo}}`)

**Reference ads:** A34 (team), A35 (owner thumbs-up), A36/A37/A38 (van)

**Component attachments:** Client-supplied photo. NO AI-generated people, vehicles, or buildings under any circumstances.

```
Create a square 1080×1080 local-trust social media ad for a residential ducted 
air conditioning installer.

LAYOUT:
- Background: clean white with a thin blue header strip.
- Top header strip: "{{region}}" in small white caps centred (e.g. 
  "BALLINA · LENNOX HEAD · BYRON BAY").
- Headline beneath the strip: "DUCTED A/C INSTALLATION EXPERTS" (or 
  "{{region}}'S DUCTED A/C SPECIALISTS") in dark navy bold uppercase, 
  two stacked lines.
- Sub-headline: small italic dark grey "Designed, Installed & Trusted Locally"
- Centre-left: place the attached client photo (team / owner / van) at 
  ~50% canvas width, full height. Use the photo EXACTLY as provided. Do 
  not regenerate, restyle, or modify the people or the vehicle.
- Centre-right (or top-right corner): green Google G logo + 
  "{{google_review_count}}+ 5-Star Google Reviews" in dark navy.
- Top-right circular badge: "FROM {{per_week_price}}" with white text on 
  blue circle (only if per-week price is supplied).
- Bottom-left: white tick-bullet list (3 items max):
  - Fully Licensed & Insured
  - Local Install Specialists
  - 5-Star Rated
- Bottom-right green CTA button: "Get A Fast Ducted Quote Today" in white.

STYLE:
- Palette: white + blue + green CTA + Google logo colours.
- Photo is the trust signal. Treat it with editorial respect — no filters, 
  no overlays, no cropping that changes the subject.

TONE: Local, human, established. The opposite of the aggressive direct-response 
ads. This is the "reassurance" piece in the pack.
```

---

## Pack assembly — example output

A new client signs on. Onboarding form returns:
- Business: Aura Air Brisbane
- City: Brisbane (in price library at $9,990 fixed / $56/week)
- Brands: Daikin, Mitsubishi, Samsung
- Install guarantee: 7 days
- Google reviews: 12 (below threshold)
- Photos: owner photo only
- Current promo: none
- Season: autumn (SH, late April)

Pack auto-assembled:
- Slot 1: Archetype 1 (Energy Bill Hero) ✓
- Slot 2: Archetype 2 (Speed Guarantee) ✓
- Slot 3: Archetype 3 (Luxury Lifestyle) ✓
- Slot 4: Archetype 5 (Seasonal Pain — Autumn → Winter version) ✓
- Slot 5: Archetype 7 (City Massive Sale — Brisbane) ✓
- Slot 6: Archetype 6 (Seasonal Sale Event) — SKIPPED (no real promo)
- Slot 7: Archetype 4 (Problem/Solution Urgency, fixed price) ✓ (city in library)
- Slot 8: Archetype 8 (Localized Clearance) — SKIPPED (no clearance promo)
- Slot 9: Archetype 10 (Local Trust) — SKIPPED (only 12 reviews)
- Slot 10: Archetype 9 (Holiday Event) — SKIPPED (no holiday in window)

→ 6 ads generated for AJ to rebuild in Canva. Pack scales up as the client adds reviews, runs promos, supplies more photos.
