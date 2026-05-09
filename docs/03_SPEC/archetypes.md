# All 10 Archetypes — Complete Reference

For the runtime config, see `tradie_force_spec.json`. This document is the human-readable description of each archetype: what it is, when it fires, what variants it has, what components it needs, what its composition pattern looks like.

Reference ad images for each archetype are in `06_REFERENCE_IMAGES/A01.png` through `A38.png` — referenced by id in each archetype's `reference_ads`.

---

## A1 — Energy Bill Hero

_Universal best-performer. Calm, authoritative, benefit-led. Anchors every pack._

**Fires:** always  
**Funnel stage:** Cold/Warm  
**Gating:** None.  
**Accent:** blue  
**Exemplar reference:** `A03.png` (in `06_REFERENCE_IMAGES/`)  

**When it fires:** Always — runs for every client.

### Reference ads (1)

- `A03.png` — "CUT YOUR ENERGY BILLS BY UP TO 30%" — Per-week pricing — All-time top performer. The exemplar.

### Archetype-specific rules

- Calm, trustworthy mood. NO people in the hero — house diagram or savings-themed visual is the hero.
- Per-week price OR no price. Never fixed price (use A4 for fixed-price pain ads).
- Headline must reference SAVING, REDUCING, or CUTTING bills — never pain framing (that belongs to A4).
- Pick fresh colours, palettes and fonts per generation. Don't lock into one look.

### Variable inputs (Layer 1 picks one of each)

**Headlines:**
- CUT YOUR ENERGY BILLS BY UP TO 30%
- SAVE UP TO 60% ON YOUR POWER BILLS
- LOWER YOUR ENERGY BILLS THIS SEASON
- SLASH YOUR ELECTRICITY BILLS WITH DUCTED A/C
- DUCTED A/C THAT PAYS FOR ITSELF
- THE EASIEST WAY TO LOWER YOUR POWER BILLS
- SAVE $1,000s ON YOUR POWER BILLS
- DROP YOUR POWER BILLS THIS YEAR
- _(+ 7 more in spec)_

**Value stacks:**
- Silent, Seamless, and Smart Cooling | Zoned Control for Maximum Comfort | 5-Year Workmanship Guarantee | $0 Upfront, Interest-Free Finance Available
- Save up to 60% on bills | $1,299 in FREE Bonuses | $0 Upfront Cost | Interest-Free Finance Available
- Energy-Star Rated System | Whole-Home Comfort | Locally Installed | $0 Upfront, Interest-Free Finance Available
- Smart Zoning Technology | Heat or Cool Just the Rooms You Use | 5-Year Workmanship Guarantee | $0 Upfront, Interest-Free Finance Available
- Premium Daikin / Mitsubishi System | Engineered for Aussie Homes | 7-Year Manufacturer Warranty | Interest-Free Finance Available
- Cuts Energy Use by Up to 30% | $1,200 in Free Bonuses | Locally Licensed & Insured | $0 Upfront
- Smart Controls from Your Phone | Run It Only Where You Need It | Interest-Free Finance | 5-Year Guarantee

**CTAs:**
- REQUEST A FREE QUOTE TODAY!
- GET YOUR FREE QUOTE
- BOOK YOUR FREE QUOTE
- GET PRICING NOW
- SEE IF YOU QUALIFY
- BOOK A FREE ON-SITE QUOTE
- GET A FAST QUOTE
- CHECK YOUR HOME'S PRICE

**Badges:**
- 50% OFF
- 40% OFF
- 30% OFF
- LIMITED TIME ONLY
- LIMITED SLOTS
- $1,299 IN BONUSES
- ENERGY STAR RATED
- 5-YEAR GUARANTEE

**Visual hero options:**
- 3D house diagram with airflow arrows visualising the system
- Person holding up an electricity bill (no AI faces — use stock or upload)
- Bill graphic with downward arrow showing savings
- Side-by-side: traditional A/C unit vs full ducted system
- Home exterior with cool/warm air visualisation
- Energy efficiency rating chart or savings graph

### Components used

- **house diagram**: house_3d_blue — hero, ~50% canvas height, centred
- **brand logos**: brand_1, brand_2, brand_3 — bottom strip, max 3

### Composition pattern (Layer 2 guidance)

```
Square 1080×1080 ad. Calm, trustworthy mood — pick a fresh colour palette and font pairing each generation. Top third: oversized high-contrast {{headline}}, readable at thumbnail size. Middle: hero visual — typically the attached house-diagram image, centred, ~50% canvas height (or one of the alternative {{visual_hero}} options like a person holding a bill or a savings graph). Below the hero: pill-shaped panel containing 'DUCTED A/C INSTALLED FOR' (small caps), {{per_week_price}} (oversized, dominant), 'PER WEEK' (small caps). Right of the pill: 4 tick-bullets pulled from {{value_stack}}. Bottom-left: rounded CTA button {{cta}}. Bottom strip: brand logos {{brand_1}}, {{brand_2}}, {{brand_3}} on a contrasting band, evenly spaced, in their native colours. NO people in the hero unless using a bill-holder visual. Clean, uncluttered, professional — let the AI pick the specific colours and fonts for visual variety.
```

---

## A2 — Speed Guarantee

_Install-time promise + family lifestyle. 'I want it now' buyer._

**Fires:** always  
**Funnel stage:** Warm/Hot OR Cold/Warm (Layer 2 picks variant based on pack balance)  
**Gating:** None — always fires.  
**Accent:** green  
**Exemplar reference:** `A02.png` (in `06_REFERENCE_IMAGES/`)  

**When it fires:** Always — every client gets a speed-guarantee ad. Install guarantee defaults to 7 days.

### Reference ads (1)

- `A02.png` — "Get Your Ducted A/C in just 7 Days!" — Per-week pricing — Best-of-class for archetype A2.

### Archetype-specific rules

- Family lifestyle photo MUST be the hero visual. Apply a tinted overlay (~15-20% opacity) for headline legibility — colour can vary.
- Guarantee badge is mandatory (top-right, circular, high-contrast). Without it, the archetype loses its identity.
- Pick fresh colours and fonts per generation. Energetic, family-friendly mood.

### Variable inputs (Layer 1 picks one of each)

**Headlines:**
- Get your Ducted A/C in just {{install_guarantee_days}}!
- FAST DUCTED A/C INSTALL — {{install_guarantee_days}} GUARANTEED
- INSTALLED IN {{install_guarantee_days}} OR LESS
- BOOK TODAY, INSTALLED IN {{install_guarantee_days}}
- SKIP THE WAITING LIST — {{install_guarantee_days}} INSTALL
- YOUR DUCTED A/C, INSTALLED IN A WEEK
- WHY WAIT? GET DUCTED A/C THIS WEEK
- COMFORT YOUR HOME IN UNDER {{install_guarantee_days}}
- _(+ 4 more in spec)_

**Value stacks:**
- Installed within {{install_guarantee_days}} | $0 Upfront | Interest-Free Finance Available | 5-Year Guarantee
- Same-Week Installation | Locally Licensed & Insured | $0 Upfront, Interest-Free Finance Available
- {{install_guarantee_days}} Install Guarantee | No Hidden Fees | Interest-Free Finance | $1,299 FREE Bonuses
- We Don't Make You Wait | Premium Brands Only | $0 Upfront | 7-Year Warranty
- Quick On-Site Quote | Locally Installed | $0 Upfront | Interest-Free Finance

**CTAs:**
- Book Now — Limited Availability
- BOOK YOUR INSTALL TODAY
- GET A FAST QUOTE
- LOCK IN YOUR INSTALL DATE
- GET QUOTE
- BOOK ON-SITE QUOTE TODAY
- CHECK AVAILABILITY

**Badges:**
- FASTEST INSTALL GUARANTEED
- {{install_guarantee_days}} INSTALL
- SAME-WEEK INSTALL
- LIMITED AVAILABILITY
- BOOK FAST
- 5-YEAR GUARANTEE
- $0 UPFRONT

**Visual hero options:**
- Family enjoying their A/C — full-bleed lifestyle photo
- Calendar with installation date highlighted
- Stopwatch or speed-themed visual
- Quick before/after split — uncomfortable home → comfortable home

### Components used

- **stock family photo**: fam_jumping or similar lifestyle photo — full-bleed background
- **brand logos**: bottom strip

### Composition pattern (Layer 2 guidance)

```
Square 1080×1080 ad. Energetic, family-friendly mood — pick fresh colours and fonts per generation. Background: full-bleed family lifestyle photo (attached). Apply a tinted overlay (~15-20% opacity) for headline legibility — colour up to AI. Top-left third: stacked headline {{headline}} — modifier in medium weight, the timeframe oversized and bold. Top-right: circular badge 'FASTEST INSTALL GUARANTEED', slightly tilted. Lower-left: italic sub-headline 'Enjoy a cool, comfortable home without the wait.' Lower-right: pill block with {{per_week_price}}, three tick-bullets beneath from {{value_stack}}. Bottom-left: small CTA pill {{cta}}.
```

---

## A3 — Luxury Lifestyle

_Premium aesthetic. Italic-serif accent on key word. Aspirational, not pushy._

**Fires:** always  
**Funnel stage:** Cold/Warm (premium audience)  
**Gating:** Premium: always. Fixed-price: city in price library AND no other fixed-price ad in pack.  
**Accent:** navy  
**Exemplar reference:** `A01.png` (in `06_REFERENCE_IMAGES/`)  

**When it fires:** Always for premium variant. Fixed-price variant only if city in price library AND no other fixed-price ad in pack.

### Variants (3)

- **Premium (no price)** (`premium`) — Aspirational
  - Fires: Default for all clients.
  - Reference: A01
- **Fixed-price luxury** (`fixed_price`) — Aspirational + offer
  - Fires: Only if no other fixed-price ad in pack AND city in price library.
  - Reference: A05, A06
- **Home value angle** (`value`) — Investment-focused
  - Fires: Default for premium-suburb clients.
  - Reference: A07

### Reference ads (4)

- `A01.png` — "Luxury Heating & Cooling — BE WINTER READY" — — pricing — Premium positioning, family piggyback photo.
- `A05.png` — "LUXURY HEATING for every room — DUCTED A/C $7,899" — Fixed pricing — Anchored discount $12,999 → $7,899.
- `A06.png` — "LUXURY COOLING for every room — DUCTED A/C $6,495" — Fixed pricing — Cooling mirror of A05.
- `A07.png` — "Boost Your Home's Value Instantly! — DUCTED A/C $6,495" — Fixed pricing — Home-value angle for premium markets.

### Archetype-specific rules

- Premium and value variants use NO price OR per-week price. Fixed-price variant uses anchored discount (RRP struck through).
- The word 'LUXURY' should be set in an elegant accent typeface (italic serif works well), contrasting the bold body type. Visual signature.
- Refined, premium mood — pick a fresh sophisticated palette per generation. Avoid bargain-bin colour combinations.

### Variable inputs (Layer 1 picks one of each)

**Headlines:**
- LUXURY DUCTED HEATING & COOLING — EVERY ROOM!
- LUXURY DUCTED A/C FOR EVERY ROOM!
- PREMIUM DUCTED CLIMATE CONTROL FOR EVERY ROOM
- WHOLE-HOME DUCTED A/C — ROOM BY ROOM
- THE PREMIUM WAY TO HEAT & COOL — DUCTED A/C
- INVEST IN HOW YOUR HOME FEELS — PREMIUM DUCTED A/C
- BOOST YOUR HOME'S VALUE — INSTALL DUCTED A/C
- THE COMFORT UPGRADE YOUR HOME DESERVES — DUCTED A/C
- _(+ 7 more in spec)_

**Value stacks:**
- Silent, Seamless, and Smart Cooling | Zoned Control for Maximum Comfort | 5-Year Workmanship Guarantee | $0 Upfront, Interest-Free Finance Available
- Adds Value to Your Property | Luxury Feature Buyers Look For | $0 Upfront, Interest-Free Finance Available
- Premium Daikin / Mitsubishi System | Whisper-Quiet Operation | Smart Phone Control | 7-Year Manufacturer Warranty
- The Ultimate in Home Comfort | Whole-Home Climate | Boost Resale Value | Free Design Consultation
- Effortless Comfort, Every Room | Zoned Control | Interest-Free Finance Available | 5-Year Workmanship Guarantee
- Engineered for Larger Australian Homes | Whisper-Quiet | Premium Brands Only | $1,299 in Free Bonuses
- Designed Around Your Home | Premium Brands | Free Design Consultation | $0 Upfront

**CTAs:**
- Upgrade Your Home Today!
- BOOK A DESIGN CONSULTATION
- GET A LUXURY QUOTE
- CLAIM YOUR FREE QUOTE
- SEE IF YOUR HOME QUALIFIES
- BOOK A FREE HOME CONSULT

**Badges:**
- Limited Time Only
- Limited Slots
- BE WINTER READY
- BE SUMMER READY
- 50% OFF (fixed-price variant)
- PREMIUM DESIGN-INSTALL
- $1,299 IN BONUSES
- 7-YEAR WARRANTY
- _(+ 1 more in spec)_

**Visual hero options:**
- Family on couch — light/airy summer or warm/cosy winter
- Father piggybacking child in living room
- Couple in bedroom relaxing
- Empty luxury living room with airflow visualisation
- Multi-room split showing different rooms with comfort
- Open-plan home with subtle climate visualisation
- Master bedroom with elegant interiors

### Components used

- **stock family photo**: fam_couch_summer / fam_couch_winter / fam_piggyback — right half hero
- **font**: elegant accent typeface for the word 'LUXURY' (italic serif works well)
- **brand logos**: bottom strip

### Composition pattern (Layer 2 guidance)

```
[premium] Square 1080×1080 premium ad. Refined, sophisticated mood — pick a fresh elegant colour palette and font pairing per generation. Left half: stacked headline {{headline}}. The word 'LUXURY' set in an elegant accent typeface (italic serif works well), the rest in oversized bold sans-serif. Beneath: 'DUCTED A/C INSTALLED FOR ONLY' small caps, {{per_week_price}} oversized bold. Right half: attached lifestyle photo full-height, right edge bleeding off canvas. Subtle airflow-vector arrows from a small ceiling vent icon above the family. Lower-left: 4-5 value-stack bullets from {{value_stack}}. Bottom-left rounded CTA button {{cta}}. Top-left small badge {{badge}}. Bottom strip: brand logos.

[fixed_price] As premium variant BUT replace per-week pricing with fixed-price block: {{fixed_price}} oversized bold, with {{anchor_price}} struck through above in smaller contrasting text. Bottom-right circular discount badge: {{discount_pct}} OFF.

[value] Square 1080×1080 home-value angle. Headline 'Boost Your Home's Value Instantly!' mixing serif italic and bold sans-serif. Sub: 'DUCTED A/C Installed for' + {{fixed_price}}. Lifestyle photo (man pointing up, or similar) on right half. House diagram small in upper-right corner.
```

---

## A4 — Problem/Solution Urgency

_Pain-led. Urgent high-contrast. Pain question + solution._

**Fires:** always  
**Funnel stage:** Warm/Hot (wallet hero) — Cold/Warm (diagram hero variant)  
**Gating:** None — always fires. Layer 2 may choose fixed-price treatment for this archetype if it wins the single fixed-price slot in the pack.  
**Accent:** red  
**Exemplar reference:** `A04.png` (in `06_REFERENCE_IMAGES/`)  

**When it fires:** Always — every client gets a pain-led ad. Pricing variant (fixed/per-week/none) is selected by Layer 2 based on pack balance.

### Reference ads (1)

- `A04.png` — "SICK OF HIGH ENERGY BILLS? — DUCTED A/C $5,799" — Fixed pricing — Black/red urgency. ONE PER PACK MAX (HR06).

### Archetype-specific rules

- Bold, dark, urgent visual treatment — the mood should communicate threat/problem. Pick fresh high-contrast palette per generation.
- Headline is split into two parts: pain question on top, oversized contrasting accent on the key noun.
- Fixed price + anchor (RRP struck through) is mandatory. ONE PER PACK MAX.
- Strong CTA button + discount badge bottom-right. High-contrast typography.

### Variable inputs (Layer 1 picks one of each)

**Headlines:**
- SICK OF HIGH ENERGY BILLS?
- TIRED OF PAYING TOO MUCH FOR POWER?
- HAD ENOUGH OF HIGH ENERGY BILLS?
- WHY IS YOUR POWER BILL SO HIGH?
- IS YOUR ELECTRICITY BILL DESTROYING YOUR BUDGET?
- DREADING YOUR NEXT POWER BILL?
- PAYING TOO MUCH FOR ENERGY?
- DOES YOUR POWER BILL KEEP CLIMBING?
- _(+ 5 more in spec)_

**Solution lines:**
- THE SOLUTION: DUCTED A/C INSTALLED FOR {{fixed_price}}
- DUCTED A/C INSTALLED FROM {{fixed_price}}
- HERE'S THE FIX — DUCTED A/C FROM {{fixed_price}}
- THE ANSWER: DUCTED A/C, FULLY INSTALLED, {{fixed_price}}
- STOP OVERPAYING — DUCTED A/C, {{fixed_price}}
- TIME TO FIX IT: DUCTED A/C, {{fixed_price}}

**CTAs:**
- REQUEST A FREE QUOTE TODAY!
- Claim This Offer
- LOCK IN YOUR PRICE
- GET QUOTE NOW
- SEE IF YOU QUALIFY
- CLAIM TODAY

**Badges:**
- {{discount_pct}} OFF
- *Hurry — Limited Slots*
- LIMITED TIME
- ENDS SOON
- ONLY [X] HOMES PER MONTH
- $0 UPFRONT
- ONCE-A-YEAR PRICING

**Visual hero options:**
- House diagram (dark/dramatic styling)
- Person looking at bill (shocked/frustrated)
- Bill graphic with '$$$' or upward arrow
- Calculator or receipt scene
- Wallet emptying / coins falling

### Components used

- **house diagram**: house_3d_dark — centre, large
- **brand logos**: bottom strip

### Composition pattern (Layer 2 guidance)

```
Square 1080×1080 ad. Bold, dark, urgent mood — pick fresh high-contrast colours and fonts per generation that communicate problem/threat. Top: high-contrast intro phrase from the first words of {{headline}} (e.g. 'SICK OF') followed by oversized bold accent-colour ending of {{headline}} (e.g. 'HIGH ENERGY BILLS?'). Centre: place the attached house-diagram image (dark/dramatic styling). Right side mid: vertical accent panel with 'THE SOLUTION:' small caps, the {{solution_line}} filled with {{fixed_price}} oversized bold. Above price: {{anchor_price}} struck through, smaller. Below: rounded button {{cta}}. Bottom-left circular badge: {{discount_pct}} OFF. Bottom strip: brand logos.
```

---

## A5 — Seasonal Pain

_Visceral pain (sweating in summer / freezing in winter)._

**Fires:** always  
**Funnel stage:** Cold/Warm  
**Gating:** None. Variant picked by current season.  
**Accent:** red  
**Exemplar reference:** `A08.png` (in `06_REFERENCE_IMAGES/`)  

**When it fires:** Always — auto-rotated by current month + hemisphere.

### Variants (2)

- **Don't Melt** (`summer`) — Visceral pain (heat)
  - Fires: Summer months in client hemisphere.
  - Reference: A08
- **Don't Freeze** (`winter`) — Visceral pain (cold)
  - Fires: Winter months in client hemisphere.
  - Reference: A09

### Reference ads (2)

- `A08.png` — "Don't Melt This Summer!" — Per-week pricing — Sweating-man reaction shot. $56/week.
- `A09.png` — "Don't Freeze This Winter!" — Per-week pricing — Family-freezing reaction shot. $56/week.

### Archetype-specific rules

- Reaction-face photo from Components Library is the hero. Must clearly read as the relevant seasonal discomfort.
- Visual treatment communicates the SEASON: heat/discomfort for summer, cold/discomfort for winter. Pick fresh palettes per generation that match the mood.
- Per-week price only (no fixed price) — keeps it cheap-feeling, fast scroll-engagement.

### Variable inputs (Layer 1 picks one of each)

**Headlines (summer):**
- Don't MELT This Summer!
- Don't SWEAT This Heatwave!
- TOO HOT TO SLEEP?
- BEAT THE 40°C DAYS
- SURVIVING SUMMER WITHOUT DUCTED A/C?
- IS YOUR HOUSE AN OVEN?
- THIS IS WHAT 40° FEELS LIKE
- HOT NIGHTS = NO SLEEP
- _(+ 2 more in spec)_

**Headlines (winter):**
- Don't FREEZE This Winter!
- SHIVERING IS NOT NORMAL
- WAKE UP WARM, NOT FROZEN
- COLD HOMES DON'T HAVE TO BE NORMAL
- TIRED OF FREEZING WHEN YOU GET HOME?
- DOES YOUR HOUSE FEEL LIKE A FRIDGE?
- STAY WARM ALL WINTER LONG
- WINTER IS COMING — IS YOUR HOME READY?
- _(+ 1 more in spec)_

**Value stacks:**
- Interest-Free Finance Available | $1,299 FREE Bonuses | $0 Upfront
- Whole-Home Comfort, All Season | $0 Upfront | 5-Year Guarantee
- Energy Efficient, Always Comfortable | Smart Zoning | $0 Upfront, Interest-Free Finance Available
- Locally Installed by Experts | $0 Upfront, Interest-Free Finance Available | 5-Year Guarantee

**CTAs:**
- REQUEST A FREE QUOTE TODAY!
- BOOK YOUR FREE QUOTE
- GET RELIEF NOW
- BEAT THE HEAT — GET A QUOTE
- ESCAPE THE COLD — GET A QUOTE
- CHECK YOUR HOME'S PRICE

**Badges:**
- 50% OFF
- LIMITED TIME
- 30% OFF
- INTEREST-FREE FINANCE
- $1,299 BONUSES
- $0 UPFRONT

**Visual hero options:**
- Sweating man with hands up (summer)
- Person fanning themselves (summer)
- Kid melting / overheated (summer)
- Family bundled up freezing (winter)
- Kid shivering in blanket (winter)
- Frosted window from inside (winter)
- Person huddled by tiny heater (winter)

### Components used

- **stock reaction photo**: react_sweating_man (summer) / react_freezing_fam (winter) — left half hero
- **house diagram**: house_3d_blue — tucked in lower-right area, smaller

### Composition pattern (Layer 2 guidance)

```
[summer] Square 1080×1080. Visual treatment communicates HEAT and discomfort — pick fresh hot-feeling colours and fonts per generation. Top: oversized uppercase headline {{headline}} — the action word ('MELT', 'SWEAT', 'HOT') set oversized in a contrasting accent. Left half: attached sweating-man (or similar) reaction photo full-height. Right half: pill block 'DUCTED A/C INSTALLED FOR' / {{per_week_price}} / 'PER WEEK'. Below pill: short value-stack bullets from {{value_stack}}. Bottom-left circular badge {{badge}}. House diagram tucked smaller in lower area. CTA {{cta}}.

[winter] As summer variant but: visual treatment communicates COLD and discomfort. Headline {{headline}} with action word ('FREEZE', 'SHIVERING') oversized in cold-feeling accent. Attached freezing-family photo as left-half hero.
```

---

## A6 — Seasonal Sale Event

_Discount-led seasonal. Reaction model + condenser/diagram + discount badge._

**Fires:** always  
**Funnel stage:** Warm/Hot  
**Gating:** None — all seasonal variants generated upfront. Promo % adjustable per launch.  
**Accent:** blue  
**Exemplar reference:** `A13.png` (in `06_REFERENCE_IMAGES/`)  

**When it fires:** Always — every client gets one ad per seasonal variant from day one. Launch each as the season comes round.

### Variants (5)

- **Winter Sale** (`winter_sale`) — Promotional + season
  - Fires: Late autumn → winter.
  - Reference: A10, A13
- **Autumn Sale** (`autumn_sale`) — Promotional + season
  - Fires: Autumn shoulder.
  - Reference: A14
- **Upgrade Your Cooling** (`cool_upgrade`) — Promotional + curiosity gap
  - Fires: Late spring → summer.
  - Reference: A11
- **Upgrade Your Heating** (`heat_upgrade`) — Promotional + curiosity gap
  - Fires: Late autumn → winter.
  - Reference: A12
- **Beat the 40° Days** (`heatwave`) — Promotional + heatwave
  - Fires: Forecast heatwave week.
  - Reference: A15

### Reference ads (6)

- `A10.png` — "STAY WARM THIS WINTER — DUCTED A/C $6,999" — Fixed pricing — Cold-woman reaction. Anchored discount.
- `A11.png` — "Upgrade Your Cooling! — Before you end up like this... $6,495" — Fixed pricing — Curiosity gap. Strong scroll-stopper.
- `A12.png` — "Upgrade Your Heating! — Before you end up like this... $6,495" — Fixed pricing — Heating mirror of A11.
- `A13.png` — "WINTER SALE — Ducted A/C $59 per week" — Per-week pricing — Per-week winter variant. Cleaner.
- `A14.png` — "AUTUMN SALE — Ducted A/C $56 per week" — Per-week pricing — Shoulder season. 35% discount.
- `A15.png` — "BEAT THE 40° DAYS WITH DUCTED A/C — $56/week" — Per-week pricing — Heatwave-specific. Purple palette.

### Archetype-specific rules

- Discount badge is mandatory and must show {{current_promo_pct}}. If promo % is 0 or null, the WHOLE ARCHETYPE is skipped.
- Reaction model is positioned pointing toward or holding the price block (visual draw).
- Visual treatment matches the variant season — pick fresh palettes and fonts per generation.

### Variable inputs (Layer 1 picks one of each)

**Headlines (winter_sale):**
- WINTER SALE — DUCTED A/C
- STAY WARM THIS WINTER — DUCTED A/C SALE
- WINTER WARMTH SALE — DUCTED HEATING
- WINTER DUCTED HEATING SALE
- WINTER DUCTED A/C — UP TO {{current_promo_pct}} OFF

**Headlines (autumn_sale):**
- AUTUMN SALE — DUCTED A/C
- AUTUMN DUCTED A/C SALE
- EARLY-SEASON DUCTED A/C SALE
- BEFORE WINTER HITS — DUCTED A/C SALE

**Headlines (cool_upgrade):**
- Upgrade Your Cooling — DUCTED A/C!
- BEFORE SUMMER HITS — UPGRADE TO DUCTED A/C
- GET READY FOR SUMMER — DUCTED A/C INSTALLED
- TIME TO UPGRADE — WHOLE-HOME DUCTED A/C

**Headlines (heat_upgrade):**
- Upgrade Your Heating — DUCTED A/C!
- BEFORE WINTER HITS — UPGRADE TO DUCTED A/C
- TIME TO UPGRADE — WHOLE-HOME DUCTED HEATING
- GET READY FOR WINTER — DUCTED HEATING INSTALLED

**Headlines (heatwave):**
- BEAT THE 40° DAYS WITH DUCTED A/C
- HEATWAVE INCOMING — UPGRADE TO DUCTED A/C NOW
- {{city}} HEATWAVE? GET DUCTED A/C INSTALLED
- BEAT THE EXTREME HEAT — DUCTED A/C

**Value stacks:**
- Silent, Seamless, and Smart Cooling | Zoned Control for Maximum Comfort | 5-Year Workmanship Guarantee | $0 Upfront, Interest-Free Finance Available
- Save Big This Season | Free Bonuses Worth $1,299 | $0 Upfront | Interest-Free Finance
- Limited Slots This Season | Premium Brands | 5-Year Guarantee | $0 Upfront
- Beat the Rush | Locally Installed | $0 Upfront | Interest-Free Finance Available

**CTAs:**
- Claim This Offer
- CHECK IF YOUR HOME QUALIFIES
- BOOK YOUR INSTALL
- GET A QUOTE
- LOCK IN SEASONAL PRICING
- CLAIM TODAY

**Badges:**
- {{current_promo_pct}} OFF
- SEASONAL DISCOUNT
- ENDS SOON
- LIMITED TIME
- WHILE STOCK LASTS
- $0 UPFRONT

### Components used

- **stock reaction photo**: varies by variant: react_cold_woman / react_pointing_up / react_sweating_man / react_freezing_fam / react_woman_white
- **house diagram or condenser**: lower corner accent
- **outlet**: outlet_round_1 / outlet_round_2 — heatwave variant uses upper-right close-up

### Composition pattern (Layer 2 guidance)

```
[winter_sale] Square 1080×1080. Visual treatment communicates winter — pick fresh winter-feeling colours and fonts per generation. Top headline {{headline}} bold, eye-catching. Centre-left: reaction model pointing toward price. Centre-right: pill block 'DUCTED A/C INSTALLED FOR' / price. Beneath pill: 4 tick-bullets from {{value_stack}}. Top-right circular badge {{current_promo_pct}} OFF.

[cool_upgrade / heat_upgrade] Visual treatment communicates the relevant season. Headline {{headline}} bold, attention-grabbing. Sub: 'Before you end up like this...' italic, with arrow pointing to reaction photo. {{fixed_price}} large bold, with {{anchor_price}} struck through.

[heatwave] Visual treatment communicates extreme heat — pick fresh hot-feeling palette per generation. Headline {{headline}}. Reaction model right half, large outlet/vent close-up upper-right. Pill block with {{per_week_price}}. CTA 'CHECK IF YOUR HOME QUALIFIES'.
```

---

## A7 — City Massive Sale

_Aggressive direct-response. City-prefixed. Single-brand focus._

**Fires:** always  
**Funnel stage:** Warm/Hot (per-week & fixed) — Cold/Warm (zoning)  
**Gating:** city is provided.  
**Accent:** navy  
**Exemplar reference:** `A19.png` (in `06_REFERENCE_IMAGES/`)  

**When it fires:** Always — default volume driver. City name in headline.

### Variants (3)

- **Per-week massive sale** (`per_week`) — Aggressive direct response
  - Fires: Default for archetype A7.
  - Reference: A19, A20, A21, A22, A23, A24, A25, A27, A29
- **Fixed-price massive sale** (`fixed_price`) — Aggressive + anchored discount
  - Fires: Only if no other fixed-price ad in pack AND city in price library.
  - Reference: A26, A28
- **With zoning** (`zoning`) — Feature-led
  - Fires: When client targets larger homes (3+ bedrooms).
  - Reference: A30, A31

### Reference ads (13)

- `A19.png` — "SYDNEY DUCTED AIRCON MASSIVE SALE — $59/week" — Per-week pricing — Aggressive volume-driver. Component grid.
- `A20.png` — "NSW DUCTED PACKAGE FULLY INSTALLED — from $56/week" — Per-week pricing — State-level variant.
- `A21.png` — "MELBOURNE FLASH SALE — $56/week" — Per-week pricing — Flash sale framing.
- `A22.png` — "MELBOURNE FLASH SALE (alt brands)" — Per-week pricing — Variant of A21.
- `A23.png` — "There's an easier way to COOL DOWN — $56/week" — Per-week pricing — Phone/controller tech angle.
- `A24.png` — "SYDNEY HOMEOWNERS — Samsung 10kW from $64/week" — Per-week pricing — Single-brand premium positioning.
- `A25.png` — "ADELAIDE HOMEOWNERS DUCTED A/C MASSIVE SALE — $64/week" — Per-week pricing — Adelaide-localized. 7-year warranty.
- `A26.png` — "DUCTED HEATING SALE — $9,990 (was $16,490)" — Fixed pricing — Heating-focused massive sale.
- `A27.png` — "DUCTED HEATING SALE — $64/week" — Per-week pricing — Per-week version of A26.
- `A28.png` — "DUCTED A/C SALE — $9,990 39% OFF" — Fixed pricing — Generic city-agnostic version.
- `A29.png` — "SYDNEY HOMEOWNERS DUCTED AIR CON — $68/week whole home" — Per-week pricing — Premium per-week. Controller tech.
- `A30.png` — "SYDNEY HOMEOWNERS DUCTED A/CON MASSIVE SALE" — Per-week pricing — Hybrid massive-sale + house diagram.
- `A31.png` — "SYDNEY HOMEOWNERS DUCTED A/C WITH ZONING — $64/week" — Per-week pricing — Feature-led zoning variant.

### Archetype-specific rules

- Headline format is FIXED: '{{city}} HOMEOWNERS' top banner, then the offer line. Don't deviate.
- Aggressive direct-response mood — high-contrast palette and bold display fonts. Pick fresh combinations per generation but always feel urgent and unmissable.
- Condenser image is the hero visual on the right side, ~40% of canvas width.

### Variable inputs (Layer 1 picks one of each)

**Headlines:**
- {{city}} HOMEOWNERS DUCTED A/C SALE
- {{city}} DUCTED AIRCON MASSIVE SALE
- {{city}} DUCTED A/C FLASH SALE
- {{city}} DUCTED HEATING SALE
- {{city}} DUCTED A/C WITH ZONING
- ATTENTION {{city}} HOMEOWNERS — DUCTED A/C SALE
- {{city}}: DUCTED A/C INSTALLED THIS MONTH
- DUCTED A/C SALE — {{city}} ONLY
- _(+ 4 more in spec)_

**Value stacks:**
- 10kW Samsung Ducted System | $0 Upfront, Interest-Free Finance Available | Locally Installed by {{city}} Experts
- Premium Daikin System | 7-Year Warranty | Locally Installed | Interest-Free Finance Available
- Whole-Home Comfort | Smart Zoning | $0 Upfront | 5-Year Guarantee
- Comfort All Year | $1,299 Bonuses | Locally Installed by {{city}} Experts
- 10kW Premium Ducted System | $0 Upfront | Interest-Free Finance | Locally Installed

**CTAs:**
- Enquire today
- GET QUOTE
- BOOK FREE QUOTE
- LOCK IN YOUR INSTALL
- {{city}} HOMEOWNERS — CLAIM TODAY
- CLAIM TODAY

**Badges:**
- ZERO UPFRONT
- {{discount_pct}} OFF
- 7-Year Warranty
- LIMITED TIME
- {{city}}-INSTALLED EXPERTS
- LOCALLY OWNED
- $0 UPFRONT

**Visual hero options:**
- Double-fan ducted condenser (default)
- Indoor ducted unit
- Wall-mounted controller
- Phone with controller app
- House diagram with zones
- Combo: condenser + controller + ducting

### Components used

- **condenser**: cond_neutral_1 / cond_neutral_2 / brand-matched — hero on right side, ~40% canvas width
- **controller**: ctrl_ipad_airtouch / ctrl_phone_app / ctrl_combo — tech-angle variants
- **house diagram**: house_3d_zones — zoning variant only

### Composition pattern (Layer 2 guidance)

```
[per_week] Square 1080×1080. Aggressive direct-response mood — pick fresh high-contrast colours and bold display fonts per generation. Top small caps banner: '{{city}} HOMEOWNERS'. Headline beneath: {{headline}} in oversized bold uppercase, with key noun ('SALE') in a contrasting accent. Sub-headline: '10kW {{brand_1}} Ducted System' (omit brand if not specified). Right side: attached double-fan condenser ~40% canvas width. Left lower: 'FROM' small caps, {{per_week_price}} oversized bold slanted slightly, '/WEEK' beneath in accent colour. Bottom-left badge with dollar-sign icon: 'ZERO UPFRONT'. Bottom-right badge with location-pin icon: 'LOCALLY INSTALLED BY {{city}} EXPERTS'.

[fixed_price] As per_week BUT replace per-week block with: 'NOW' small caps, {{fixed_price}} oversized bold, 'WAS {{anchor_price}}' struck through. Top-right burst badge: {{discount_pct}} OFF.

[zoning] As per_week BUT replace condenser with attached house-diagram-with-zones. Headline: '{{city}} HOMEOWNERS DUCTED A/C WITH ZONING'.
```

---

## A8 — Localized Clearance

_Plain low-friction city-prefixed clearance. Lighter than A7._

**Fires:** always  
**Funnel stage:** Warm/Hot  
**Gating:** None — always fires. Layer 2 may choose fixed-price treatment if A8 wins the single fixed-price slot.  
**Accent:** green  
**Exemplar reference:** `A16.png` (in `06_REFERENCE_IMAGES/`)  

**When it fires:** Always — every client gets a clearance-style ad. Used for EOFY, stock clearance, rebate hooks.

### Reference ads (3)

- `A16.png` — "PERTH DUCTED A/C SALE — $9,990" — Fixed pricing — City-prefixed clearance. Plain.
- `A17.png` — "DUCTED A/C CLEARANCE SALE — 30% off" — — pricing — Generic clearance positioning.
- `A18.png` — "Save $7000 VIC REBATES! — $5,799 Ducted A/C" — Fixed pricing — Rebate hook. Replicable for NSW.

### Archetype-specific rules

- Lighter, less aggressive than A7. Clean, professional mood — pick fresh palettes per generation.
- Wider visual breathing room than A7.
- Fixed price + city + clearance/rebate framing.

### Variable inputs (Layer 1 picks one of each)

**Headlines:**
- {{city}} DUCTED A/C CLEARANCE SALE!
- {{city}} EOFY DUCTED A/C SALE
- Save {{rebate_amount}} {{state}} REBATES!
- {{state}} REBATES: SAVE {{rebate_amount}}
- {{city}} END OF FINANCIAL YEAR DUCTED A/C
- LAST DAYS — {{city}} DUCTED A/C CLEARANCE
- {{state}} HOMEOWNERS — CLAIM YOUR REBATE
- {{city}} STOCK CLEARANCE — DUCTED A/C
- _(+ 2 more in spec)_

**Value stacks:**
- Limited Stock | Locally Installed | Interest-Free Finance Available | 5-Year Guarantee
- {{state}} Rebate Eligible | $0 Upfront | Interest-Free Finance | 5-Year Guarantee
- Final Days, Final Stock | $1,299 Free Bonuses | Locally Installed by {{city}} Experts
- Save Big With Government Rebates | Locally Installed | $0 Upfront

**CTAs:**
- REQUEST A FREE QUOTE TODAY!
- CLAIM YOUR REBATE
- LOCK IN YOUR INSTALL
- BOOK YOUR FREE QUOTE
- {{state}} HOMEOWNERS — CLAIM TODAY

**Badges:**
- {{discount_pct}} OFF
- ZERO UPFRONT
- {{state}} REBATE ELIGIBLE
- LIMITED STOCK
- ENDS SOON
- $0 UPFRONT

### Components used

- **house diagram**: house_3d_blue — centre-left, medium scale
- **brand logos**: bottom strip

### Composition pattern (Layer 2 guidance)

```
Square 1080×1080 plain clearance ad. Clean, professional mood — pick fresh palette and fonts per generation. Top: small location pill with map-pin icon: '{{city}}'. Headline beneath, two stacked lines: {{headline}} in bold uppercase. Centre-left: attached house diagram, medium scale. Centre-right: {{fixed_price}} large bold with sub-text 'Save on your Power Bills' or 'Energy Efficient — Save on electricity'. Bottom-right circular badge: {{discount_pct}} OFF. Bottom strip: brand logos. WIDER VISUAL BREATHING ROOM than archetype A7.
```

---

## A9 — Holiday Event

_Calendar-bound urgency. Every major retail holiday gets its own ad._

**Fires:** always  
**Funnel stage:** Hot  
**Gating:** None — every variant generated upfront and labeled with launch dates.  
**Accent:** red  
**Exemplar reference:** `A33.png` (in `06_REFERENCE_IMAGES/`)  

**When it fires:** Always — every major retail holiday gets an ad generated upfront. No date-window gating. Launch the relevant variant as the holiday approaches.

### Variants (10)

- **Australia Day Sale** (`australia_day`) — Heavy summer / patriotic
  - Fires: Launch dates: Jan 20-26 each year
  - Reference: A32
- **Easter Sale** (`easter_sale`) — Clean shoulder-season
  - Fires: Launch dates: ~10 days before Good Friday (March/April, varies)
  - Reference: A33
- **Mother's Day Sale** (`mothers_day`) — Clean / gift framing
  - Fires: Launch dates: 2nd Sunday of May ± 7 days
  - Reference: A33
- **EOFY Sale** (`eofy_sale`) — Heavy / fixed-price + tax framing
  - Fires: Launch dates: June 1 - June 30 each year
  - Reference: A32
- **Father's Day Sale** (`fathers_day`) — Clean / gift framing
  - Fires: Launch dates: 1st Sunday of September ± 7 days
  - Reference: A33
- **Click Frenzy** (`click_frenzy`) — Heavy / flash sale
  - Fires: Launch dates: mid-November each year (varies)
  - Reference: A32
- **Black Friday Sale** (`black_friday`) — Heavy / dark high-discount
  - Fires: Launch dates: last Friday of November ± 5 days
  - Reference: A32
- **Cyber Monday Sale** (`cyber_monday`) — Clean / finance-led
  - Fires: Launch dates: Monday after Black Friday
  - Reference: A33
- **Boxing Day Sale** (`boxing_day`) — Heavy / summer high-discount
  - Fires: Launch dates: Dec 26 - Jan 5
  - Reference: A32
- **New Year Sale** (`new_year_sale`) — Clean / fresh-start framing
  - Fires: Launch dates: Jan 1 - Jan 14
  - Reference: A33

### Reference ads (2)

- `A32.png` — "BLACK FRIDAY — DISCOUNT UP TO 30%" — — pricing — Heavy holiday. Tradesman thumbs-up.
- `A33.png` — "BLACK FRIDAY SALE — Ducted A/C $140/week" — Per-week pricing — Clean per-week holiday variant.

### Archetype-specific rules

- Holiday name dominates the visual. Time-bound urgency is the entire point.
- Heavy variant: 1080×1350 portrait, dramatic high-contrast mood. Clean variant: 1080×1080 square, lighter mood. Pick fresh palettes per generation.

### Variable inputs (Layer 1 picks one of each)

**Headlines:**
- BLACK FRIDAY DUCTED A/C SALE
- BOXING DAY DUCTED A/C SALE
- EASTER SALE — DUCTED A/C
- EOFY DUCTED A/C SALE
- NEW YEAR DUCTED A/C SALE
- AUSTRALIA DAY DUCTED A/C SALE
- BLACK FRIDAY: BIGGEST SALE OF THE YEAR
- HOLIDAY SALE — UP TO {{discount_pct}}
- _(+ 3 more in spec)_

**Value stacks:**
- Best Pricing of the Year | $0 Upfront | Interest-Free Finance | 5-Year Guarantee
- Holiday Bonuses Worth $1,299 | Locally Installed | $0 Upfront, Interest-Free Finance Available
- Once-A-Year Pricing | Limited Stock | Premium Brands | 7-Year Warranty
- Beat the Summer Rush | $0 Upfront | Interest-Free Finance | 5-Year Guarantee

**CTAs:**
- GET QUOTE
- CLAIM HOLIDAY DEAL
- BOOK BEFORE IT ENDS
- LOCK IN HOLIDAY PRICE
- CLAIM TODAY

**Badges:**
- DISCOUNT UP TO {{discount_pct}}
- 30% OFF
- 50% OFF
- {{holiday_name}} EXCLUSIVE
- BIGGEST SAVINGS OF THE YEAR
- ONCE A YEAR
- ENDS {{holiday_end_date}}

### Components used

- **stock reaction photo**: react_tradesman — heavy variant, centre-right portrait
- **condenser**: cond_neutral_1 — clean variant, centre
- **outlet**: outlet_round_1 — clean variant accent

### Composition pattern (Layer 2 guidance)

```
Layer 2 picks heavy or clean treatment based on the holiday's tone (heavy = dramatic dark direct-response for high-discount holidays like Black Friday, Boxing Day, Click Frenzy, Australia Day, EOFY; clean = lighter finance-led for gift-giving / shoulder holidays like Mother's Day, Father's Day, Cyber Monday, New Year, Easter).

[heavy] Portrait 1080×1350. Dramatic, high-contrast mood — pick fresh dark palette per generation that matches the holiday (Black Friday = dark; Australia Day = patriotic; Boxing Day = summer-red). Banner across upper third: {{holiday_name}} oversized bold sans-serif — dominant visual. Beneath: 'DUCTED A/C SALE' bold + 'UP TO {{discount_pct}}' high-contrast accent. Centre-right: tradesman-portrait photo (attached) — use AS-IS, do NOT modify. Bottom-left rounded button {{cta}}. Bottom strip: small brand logos.

[clean] Square 1080×1080. Light, finance-led mood — pick fresh lighter palette per generation matched to the holiday's mood. Top banner '{{holiday_name}} SALE' in contrasting accent. Top-left circular badge: {{discount_pct}} OFF. Centre: attached condenser image (locked component). Right of condenser: 'DUCTED A/C INSTALLED FROM' / {{per_week_price}}. Beneath: short urgency line tied to the holiday (e.g. 'GIFT YOURSELF COMFORT THIS MOTHER'S DAY'). Bottom: micro-disclaimer.

For each holiday variant, lean into that holiday's specific cultural mood — Father's Day = warm/gift, Mother's Day = warm/gift, EOFY = tax-deduction angle, Australia Day = patriotic summer, Boxing Day = post-Christmas value, Black Friday = aggressive dark-deal urgency.
```

---

## A10 — Local Trust

_Team / owner / van photo + Google reviews. Highest-trust signal._

**Fires:** conditional  
**Funnel stage:** Cold/Warm  
**Gating:** (team_photo OR owner_photo OR van_photo). Review count is NOT a gating factor for the ad firing — it only controls whether the Google review badge is shown.  
**Accent:** green  
**Exemplar reference:** `A37.png` (in `06_REFERENCE_IMAGES/`)  

**When it fires:** Fires whenever client has at least one of [team_photo, owner_photo, van_photo]. Google reviews badge only appears if review_count ≥ 30 — otherwise the ad still runs but without the review badge.

### Variants (3)

- **Team photo** (`team`) — Established, professional
  - Fires: Client has team_photo upload. Review badge shown if ≥30 reviews.
  - Reference: A34, A36
- **Owner thumbs-up** (`owner`) — Personal, owner-led
  - Fires: Client has owner_photo. Review badge shown if ≥30 reviews.
  - Reference: A35
- **Van + owner** (`van`) — Local, mobile, established
  - Fires: Client has van_photo. Review badge shown if ≥30 reviews.
  - Reference: A37, A38

### Reference ads (5)

- `A34.png` — "NORTHERN MELBOURNE'S DUCTED A/C SPECIALISTS" — — pricing — MHI Diamond Dealer. 168 reviews.
- `A35.png` — "CARRUM DOWNS DUCTED A/C INSTALLATION EXPERTS" — Per-week pricing — Owner thumbs-up portrait.
- `A36.png` — "BALLINA · LENNOX HEAD · BYRON BAY — Team" — Per-week pricing — Team in front of van.
- `A37.png` — "BALLINA · LENNOX HEAD · BYRON BAY — Van" — Per-week pricing — Owner with van. 145+ reviews.
- `A38.png` — "CENTRAL COAST · NEWCASTLE — Van" — Per-week pricing — BORDERLINE: only 29 reviews — under 30-review gate.

### Archetype-specific rules

- Client photo (team/owner/van) is used EXACTLY as uploaded — no AI modification of people, vehicle, or setting.
- Google G logo + review count is the second-most prominent element after the photo.
- Top header strip shows the {{region}} or {{city}} location prominently.
- Trust-focused, professional mood — pick fresh palettes per generation, but always feel clean and credible (not flashy).

### Variable inputs (Layer 1 picks one of each)

**Headlines:**
- {{region}}'S DUCTED A/C SPECIALISTS
- {{region}} DUCTED A/C INSTALLATION EXPERTS
- {{region}}'S #1 DUCTED A/C INSTALLERS
- THE {{region}} TEAM YOU CAN TRUST
- LOCALLY OWNED, LOCALLY OPERATED — {{region}}
- {{region}}'S 5-STAR DUCTED A/C TEAM
- {{region}} HOMEOWNERS' TRUSTED DUCTED A/C INSTALLERS
- THE {{region}} TEAM YOUR NEIGHBOURS RECOMMEND
- _(+ 2 more in spec)_

**Sub-headlines:**
- DESIGNED, INSTALLED & TRUSTED LOCALLY
- LOCALLY OWNED & OPERATED
- {{google_review_count}}+ HAPPY {{region}} CUSTOMERS
- TRUSTED BY {{region}} HOMEOWNERS
- FAMILY-RUN, LOCALLY-OWNED

**Value stacks:**
- Fully Licensed & Insured | Local Install Specialists | 5-Star Rated | Free On-Site Quote
- Same-Day Quotes | Local {{region}} Team | $0 Upfront | 5-Year Workmanship Guarantee
- {{google_review_count}}+ 5-Star Reviews | Free On-Site Quote | Locally Owned | Interest-Free Finance Available
- Locally Owned, Family Run | {{google_review_count}}+ 5-Star Reviews | $0 Upfront | 5-Year Guarantee

**CTAs:**
- Book Your Free On-Site Quote Today
- Get A Fast Ducted Quote Today
- GET A FREE QUOTE
- BOOK ON-SITE QUOTE
- TALK TO A {{region}} EXPERT

**Badges:**
- {{google_review_count}}+ 5-STAR GOOGLE REVIEWS
- 5.0 RATED
- LOCALLY OWNED
- {{region}} TEAM
- LICENSED & INSURED
- FREE ON-SITE QUOTE
- FAMILY-RUN

### Components used

- **client uploads**: team_photo / owner_photo / van_photo — USE EXACTLY AS PROVIDED
- **trust badge**: google_5star — top-right corner
- **trust badge**: mhi_diamond — optional, if client is MHI Diamond Dealer
- **house diagram**: house_3d_blue — optional small accent for van variant

### Composition pattern (Layer 2 guidance)

```
[team] Square 1080×1080 trust ad. Clean, credible, professional mood — pick fresh palette and fonts per generation but keep the feel professional (not flashy). Thin header strip at top: {{region}} in small caps centred. Headline beneath: {{headline}} bold uppercase, two stacked lines. Sub-headline: small italic 'Designed, Installed & Trusted Locally'. Centre-left: place client team_photo at ~50% canvas width, full height — USE EXACTLY AS PROVIDED, do not modify the people. Top-right corner: green Google G logo + {{google_review_count}}+ 5-Star Google Reviews. Optional top-right circle 'FROM {{per_week_price}}'. Bottom-left tick-bullets from {{value_stack}}. Bottom-right CTA {{cta}}.

[owner] As team variant but use owner_photo (single subject, thumbs-up pose preferred). 5.0 Rated badge replaces multi-review structure if appropriate.

[van] As team variant but use van_photo. House diagram tucked into lower-left corner as additional trust signal.
```

---

