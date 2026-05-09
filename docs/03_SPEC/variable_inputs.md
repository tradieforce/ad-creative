# Variable Inputs Reference

Each archetype has a pool of `variable_inputs` — headlines, CTAs, badges, value stacks, sub-headlines. Layer 1 picks one from each pool when generating a manifest entry. Layer 2 may use these directly or rewrite based on pack context and vision analysis.

This document lists the full variable input pool per archetype. Source of truth: `tradie_force_spec.json` → `archetypes[].variable_inputs`.

## Why pools instead of single values

- Variety — running the same headline across every pack would hurt CTR over time
- A/B test surface — Bray can prune low performers and add new ones from real Meta data
- Locality — many headlines reference `{{city}}` or `{{region}}` for personalisation

## Placeholders

Layer 1 substitutes these at manifest-time:

| Placeholder | Source |
|---|---|
| `{{city}}` | client.city |
| `{{region}}` | client.region |
| `{{state}}` | derived from client.city |
| `{{per_week_price}}` | spec.prices[city].per_week_price |
| `{{fixed_price}}` | spec.prices[city].fixed_price |
| `{{anchor_price}}` | spec.prices[city].rrp_struck_through |
| `{{rebate_amount}}` | spec.prices[city].rebate_amount |
| `{{discount_pct}}` | client.default_promo_pct |
| `{{install_guarantee_days}}` | "7 days" (HR17 — fixed) |
| `{{holiday_name}}` | derived from A9 variant key |
| `{{brand_1}}`, `{{brand_2}}`, `{{brand_3}}` | client.brands_installed[0..2] |
| `{{google_review_count}}` | client.google_review_count |

## How to read this doc

Each archetype below shows representative samples from its variable input pools. The full pool is in `tradie_force_spec.json`. Edit there.

## A1 — Energy Bill Hero

**Headlines** (15 options):
- CUT YOUR ENERGY BILLS BY UP TO 30%
- SAVE UP TO 60% ON YOUR POWER BILLS
- LOWER YOUR ENERGY BILLS THIS SEASON
- SLASH YOUR ELECTRICITY BILLS WITH DUCTED A/C
- DUCTED A/C THAT PAYS FOR ITSELF
- _(+ 10 more)_

**Value stacks** (7 options):
- Silent, Seamless, and Smart Cooling | Zoned Control for Maximum Comfort | 5-Year Workmanship Guarantee | $0 Upfront, Interest-Free Finance Available
- Save up to 60% on bills | $1,299 in FREE Bonuses | $0 Upfront Cost | Interest-Free Finance Available
- Energy-Star Rated System | Whole-Home Comfort | Locally Installed | $0 Upfront, Interest-Free Finance Available
- Smart Zoning Technology | Heat or Cool Just the Rooms You Use | 5-Year Workmanship Guarantee | $0 Upfront, Interest-Free Finance Available
- Premium Daikin / Mitsubishi System | Engineered for Aussie Homes | 7-Year Manufacturer Warranty | Interest-Free Finance Available
- _(+ 2 more)_

**CTAs** (8 options):
- REQUEST A FREE QUOTE TODAY!
- GET YOUR FREE QUOTE
- BOOK YOUR FREE QUOTE
- GET PRICING NOW
- SEE IF YOU QUALIFY
- _(+ 3 more)_

**Badges** (8 options):
- 50% OFF
- 40% OFF
- 30% OFF
- LIMITED TIME ONLY
- LIMITED SLOTS
- _(+ 3 more)_

**Visual hero options** (6 options):
- 3D house diagram with airflow arrows visualising the system
- Person holding up an electricity bill (no AI faces — use stock or upload)
- Bill graphic with downward arrow showing savings
- Side-by-side: traditional A/C unit vs full ducted system
- Home exterior with cool/warm air visualisation
- _(+ 1 more)_

---

## A2 — Speed Guarantee

**Headlines** (12 options):
- Get your Ducted A/C in just {{install_guarantee_days}}!
- FAST DUCTED A/C INSTALL — {{install_guarantee_days}} GUARANTEED
- INSTALLED IN {{install_guarantee_days}} OR LESS
- BOOK TODAY, INSTALLED IN {{install_guarantee_days}}
- SKIP THE WAITING LIST — {{install_guarantee_days}} INSTALL
- _(+ 7 more)_

**Value stacks** (5 options):
- Installed within {{install_guarantee_days}} | $0 Upfront | Interest-Free Finance Available | 5-Year Guarantee
- Same-Week Installation | Locally Licensed & Insured | $0 Upfront, Interest-Free Finance Available
- {{install_guarantee_days}} Install Guarantee | No Hidden Fees | Interest-Free Finance | $1,299 FREE Bonuses
- We Don't Make You Wait | Premium Brands Only | $0 Upfront | 7-Year Warranty
- Quick On-Site Quote | Locally Installed | $0 Upfront | Interest-Free Finance

**CTAs** (7 options):
- Book Now — Limited Availability
- BOOK YOUR INSTALL TODAY
- GET A FAST QUOTE
- LOCK IN YOUR INSTALL DATE
- GET QUOTE
- _(+ 2 more)_

**Badges** (7 options):
- FASTEST INSTALL GUARANTEED
- {{install_guarantee_days}} INSTALL
- SAME-WEEK INSTALL
- LIMITED AVAILABILITY
- BOOK FAST
- _(+ 2 more)_

**Visual hero options** (4 options):
- Family enjoying their A/C — full-bleed lifestyle photo
- Calendar with installation date highlighted
- Stopwatch or speed-themed visual
- Quick before/after split — uncomfortable home → comfortable home

---

## A3 — Luxury Lifestyle

**Headlines** (15 options):
- LUXURY DUCTED HEATING & COOLING — EVERY ROOM!
- LUXURY DUCTED A/C FOR EVERY ROOM!
- PREMIUM DUCTED CLIMATE CONTROL FOR EVERY ROOM
- WHOLE-HOME DUCTED A/C — ROOM BY ROOM
- THE PREMIUM WAY TO HEAT & COOL — DUCTED A/C
- _(+ 10 more)_

**Value stacks** (7 options):
- Silent, Seamless, and Smart Cooling | Zoned Control for Maximum Comfort | 5-Year Workmanship Guarantee | $0 Upfront, Interest-Free Finance Available
- Adds Value to Your Property | Luxury Feature Buyers Look For | $0 Upfront, Interest-Free Finance Available
- Premium Daikin / Mitsubishi System | Whisper-Quiet Operation | Smart Phone Control | 7-Year Manufacturer Warranty
- The Ultimate in Home Comfort | Whole-Home Climate | Boost Resale Value | Free Design Consultation
- Effortless Comfort, Every Room | Zoned Control | Interest-Free Finance Available | 5-Year Workmanship Guarantee
- _(+ 2 more)_

**CTAs** (6 options):
- Upgrade Your Home Today!
- BOOK A DESIGN CONSULTATION
- GET A LUXURY QUOTE
- CLAIM YOUR FREE QUOTE
- SEE IF YOUR HOME QUALIFIES
- _(+ 1 more)_

**Badges** (9 options):
- Limited Time Only
- Limited Slots
- BE WINTER READY
- BE SUMMER READY
- 50% OFF (fixed-price variant)
- _(+ 4 more)_

**Visual hero options** (7 options):
- Family on couch — light/airy summer or warm/cosy winter
- Father piggybacking child in living room
- Couple in bedroom relaxing
- Empty luxury living room with airflow visualisation
- Multi-room split showing different rooms with comfort
- _(+ 2 more)_

---

## A4 — Problem/Solution Urgency

**Headlines** (13 options):
- SICK OF HIGH ENERGY BILLS?
- TIRED OF PAYING TOO MUCH FOR POWER?
- HAD ENOUGH OF HIGH ENERGY BILLS?
- WHY IS YOUR POWER BILL SO HIGH?
- IS YOUR ELECTRICITY BILL DESTROYING YOUR BUDGET?
- _(+ 8 more)_

**Solution lines** (6 options):
- THE SOLUTION: DUCTED A/C INSTALLED FOR {{fixed_price}}
- DUCTED A/C INSTALLED FROM {{fixed_price}}
- HERE'S THE FIX — DUCTED A/C FROM {{fixed_price}}
- THE ANSWER: DUCTED A/C, FULLY INSTALLED, {{fixed_price}}
- STOP OVERPAYING — DUCTED A/C, {{fixed_price}}
- _(+ 1 more)_

**CTAs** (6 options):
- REQUEST A FREE QUOTE TODAY!
- Claim This Offer
- LOCK IN YOUR PRICE
- GET QUOTE NOW
- SEE IF YOU QUALIFY
- _(+ 1 more)_

**Badges** (7 options):
- {{discount_pct}} OFF
- *Hurry — Limited Slots*
- LIMITED TIME
- ENDS SOON
- ONLY [X] HOMES PER MONTH
- _(+ 2 more)_

**Visual hero options** (5 options):
- House diagram (dark/dramatic styling)
- Person looking at bill (shocked/frustrated)
- Bill graphic with '$$$' or upward arrow
- Calculator or receipt scene
- Wallet emptying / coins falling

---

## A5 — Seasonal Pain

**Headlines (summer)** (10 options):
- Don't MELT This Summer!
- Don't SWEAT This Heatwave!
- TOO HOT TO SLEEP?
- BEAT THE 40°C DAYS
- SURVIVING SUMMER WITHOUT DUCTED A/C?
- _(+ 5 more)_

**Headlines (winter)** (9 options):
- Don't FREEZE This Winter!
- SHIVERING IS NOT NORMAL
- WAKE UP WARM, NOT FROZEN
- COLD HOMES DON'T HAVE TO BE NORMAL
- TIRED OF FREEZING WHEN YOU GET HOME?
- _(+ 4 more)_

**Value stacks** (4 options):
- Interest-Free Finance Available | $1,299 FREE Bonuses | $0 Upfront
- Whole-Home Comfort, All Season | $0 Upfront | 5-Year Guarantee
- Energy Efficient, Always Comfortable | Smart Zoning | $0 Upfront, Interest-Free Finance Available
- Locally Installed by Experts | $0 Upfront, Interest-Free Finance Available | 5-Year Guarantee

**CTAs** (6 options):
- REQUEST A FREE QUOTE TODAY!
- BOOK YOUR FREE QUOTE
- GET RELIEF NOW
- BEAT THE HEAT — GET A QUOTE
- ESCAPE THE COLD — GET A QUOTE
- _(+ 1 more)_

**Badges** (6 options):
- 50% OFF
- LIMITED TIME
- 30% OFF
- INTEREST-FREE FINANCE
- $1,299 BONUSES
- _(+ 1 more)_

**Visual hero options** (7 options):
- Sweating man with hands up (summer)
- Person fanning themselves (summer)
- Kid melting / overheated (summer)
- Family bundled up freezing (winter)
- Kid shivering in blanket (winter)
- _(+ 2 more)_

---

## A6 — Seasonal Sale Event

**Headlines (winter_sale)** (5 options):
- WINTER SALE — DUCTED A/C
- STAY WARM THIS WINTER — DUCTED A/C SALE
- WINTER WARMTH SALE — DUCTED HEATING
- WINTER DUCTED HEATING SALE
- WINTER DUCTED A/C — UP TO {{current_promo_pct}} OFF

**Headlines (autumn_sale)** (4 options):
- AUTUMN SALE — DUCTED A/C
- AUTUMN DUCTED A/C SALE
- EARLY-SEASON DUCTED A/C SALE
- BEFORE WINTER HITS — DUCTED A/C SALE

**Headlines (cool_upgrade)** (4 options):
- Upgrade Your Cooling — DUCTED A/C!
- BEFORE SUMMER HITS — UPGRADE TO DUCTED A/C
- GET READY FOR SUMMER — DUCTED A/C INSTALLED
- TIME TO UPGRADE — WHOLE-HOME DUCTED A/C

**Headlines (heat_upgrade)** (4 options):
- Upgrade Your Heating — DUCTED A/C!
- BEFORE WINTER HITS — UPGRADE TO DUCTED A/C
- TIME TO UPGRADE — WHOLE-HOME DUCTED HEATING
- GET READY FOR WINTER — DUCTED HEATING INSTALLED

**Headlines (heatwave)** (4 options):
- BEAT THE 40° DAYS WITH DUCTED A/C
- HEATWAVE INCOMING — UPGRADE TO DUCTED A/C NOW
- {{city}} HEATWAVE? GET DUCTED A/C INSTALLED
- BEAT THE EXTREME HEAT — DUCTED A/C

**Value stacks** (4 options):
- Silent, Seamless, and Smart Cooling | Zoned Control for Maximum Comfort | 5-Year Workmanship Guarantee | $0 Upfront, Interest-Free Finance Available
- Save Big This Season | Free Bonuses Worth $1,299 | $0 Upfront | Interest-Free Finance
- Limited Slots This Season | Premium Brands | 5-Year Guarantee | $0 Upfront
- Beat the Rush | Locally Installed | $0 Upfront | Interest-Free Finance Available

**CTAs** (6 options):
- Claim This Offer
- CHECK IF YOUR HOME QUALIFIES
- BOOK YOUR INSTALL
- GET A QUOTE
- LOCK IN SEASONAL PRICING
- _(+ 1 more)_

**Badges** (6 options):
- {{current_promo_pct}} OFF
- SEASONAL DISCOUNT
- ENDS SOON
- LIMITED TIME
- WHILE STOCK LASTS
- _(+ 1 more)_

---

## A7 — City Massive Sale

**Headlines** (12 options):
- {{city}} HOMEOWNERS DUCTED A/C SALE
- {{city}} DUCTED AIRCON MASSIVE SALE
- {{city}} DUCTED A/C FLASH SALE
- {{city}} DUCTED HEATING SALE
- {{city}} DUCTED A/C WITH ZONING
- _(+ 7 more)_

**Value stacks** (5 options):
- 10kW Samsung Ducted System | $0 Upfront, Interest-Free Finance Available | Locally Installed by {{city}} Experts
- Premium Daikin System | 7-Year Warranty | Locally Installed | Interest-Free Finance Available
- Whole-Home Comfort | Smart Zoning | $0 Upfront | 5-Year Guarantee
- Comfort All Year | $1,299 Bonuses | Locally Installed by {{city}} Experts
- 10kW Premium Ducted System | $0 Upfront | Interest-Free Finance | Locally Installed

**CTAs** (6 options):
- Enquire today
- GET QUOTE
- BOOK FREE QUOTE
- LOCK IN YOUR INSTALL
- {{city}} HOMEOWNERS — CLAIM TODAY
- _(+ 1 more)_

**Badges** (7 options):
- ZERO UPFRONT
- {{discount_pct}} OFF
- 7-Year Warranty
- LIMITED TIME
- {{city}}-INSTALLED EXPERTS
- _(+ 2 more)_

**Visual hero options** (6 options):
- Double-fan ducted condenser (default)
- Indoor ducted unit
- Wall-mounted controller
- Phone with controller app
- House diagram with zones
- _(+ 1 more)_

---

## A8 — Localized Clearance

**Headlines** (10 options):
- {{city}} DUCTED A/C CLEARANCE SALE!
- {{city}} EOFY DUCTED A/C SALE
- Save {{rebate_amount}} {{state}} REBATES!
- {{state}} REBATES: SAVE {{rebate_amount}}
- {{city}} END OF FINANCIAL YEAR DUCTED A/C
- _(+ 5 more)_

**Value stacks** (4 options):
- Limited Stock | Locally Installed | Interest-Free Finance Available | 5-Year Guarantee
- {{state}} Rebate Eligible | $0 Upfront | Interest-Free Finance | 5-Year Guarantee
- Final Days, Final Stock | $1,299 Free Bonuses | Locally Installed by {{city}} Experts
- Save Big With Government Rebates | Locally Installed | $0 Upfront

**CTAs** (5 options):
- REQUEST A FREE QUOTE TODAY!
- CLAIM YOUR REBATE
- LOCK IN YOUR INSTALL
- BOOK YOUR FREE QUOTE
- {{state}} HOMEOWNERS — CLAIM TODAY

**Badges** (6 options):
- {{discount_pct}} OFF
- ZERO UPFRONT
- {{state}} REBATE ELIGIBLE
- LIMITED STOCK
- ENDS SOON
- _(+ 1 more)_

---

## A9 — Holiday Event

**Headlines** (11 options):
- BLACK FRIDAY DUCTED A/C SALE
- BOXING DAY DUCTED A/C SALE
- EASTER SALE — DUCTED A/C
- EOFY DUCTED A/C SALE
- NEW YEAR DUCTED A/C SALE
- _(+ 6 more)_

**Value stacks** (4 options):
- Best Pricing of the Year | $0 Upfront | Interest-Free Finance | 5-Year Guarantee
- Holiday Bonuses Worth $1,299 | Locally Installed | $0 Upfront, Interest-Free Finance Available
- Once-A-Year Pricing | Limited Stock | Premium Brands | 7-Year Warranty
- Beat the Summer Rush | $0 Upfront | Interest-Free Finance | 5-Year Guarantee

**CTAs** (5 options):
- GET QUOTE
- CLAIM HOLIDAY DEAL
- BOOK BEFORE IT ENDS
- LOCK IN HOLIDAY PRICE
- CLAIM TODAY

**Badges** (7 options):
- DISCOUNT UP TO {{discount_pct}}
- 30% OFF
- 50% OFF
- {{holiday_name}} EXCLUSIVE
- BIGGEST SAVINGS OF THE YEAR
- _(+ 2 more)_

---

## A10 — Local Trust

**Headlines** (10 options):
- {{region}}'S DUCTED A/C SPECIALISTS
- {{region}} DUCTED A/C INSTALLATION EXPERTS
- {{region}}'S #1 DUCTED A/C INSTALLERS
- THE {{region}} TEAM YOU CAN TRUST
- LOCALLY OWNED, LOCALLY OPERATED — {{region}}
- _(+ 5 more)_

**Sub-headlines** (5 options):
- DESIGNED, INSTALLED & TRUSTED LOCALLY
- LOCALLY OWNED & OPERATED
- {{google_review_count}}+ HAPPY {{region}} CUSTOMERS
- TRUSTED BY {{region}} HOMEOWNERS
- FAMILY-RUN, LOCALLY-OWNED

**Value stacks** (4 options):
- Fully Licensed & Insured | Local Install Specialists | 5-Star Rated | Free On-Site Quote
- Same-Day Quotes | Local {{region}} Team | $0 Upfront | 5-Year Workmanship Guarantee
- {{google_review_count}}+ 5-Star Reviews | Free On-Site Quote | Locally Owned | Interest-Free Finance Available
- Locally Owned, Family Run | {{google_review_count}}+ 5-Star Reviews | $0 Upfront | 5-Year Guarantee

**CTAs** (5 options):
- Book Your Free On-Site Quote Today
- Get A Fast Ducted Quote Today
- GET A FREE QUOTE
- BOOK ON-SITE QUOTE
- TALK TO A {{region}} EXPERT

**Badges** (7 options):
- {{google_review_count}}+ 5-STAR GOOGLE REVIEWS
- 5.0 RATED
- LOCALLY OWNED
- {{region}} TEAM
- LICENSED & INSURED
- _(+ 2 more)_

---

