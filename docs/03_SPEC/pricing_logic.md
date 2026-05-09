# Pricing Logic

Three pricing modes. Layer 2 picks the mode for each ad based on archetype + pack balance. The Healthy Price Library defines the values per city.

## The three modes

### `per_week` — DEFAULT
- Most ads in the pack
- Format: "$56/week" or "FROM $56/WEEK"
- Promotes finance offering — lower psychological barrier
- Drives the agency's commission revenue (clip on every finance deal the client closes)
- Used in: A1, A2, A3 (premium/value), A4 (default variants), A5, A6, A7 per_week+zoning, A8 default, A9 clean variants

### `fixed_price` — ONE PER PACK MAXIMUM (HR06)
- Layer 2 awards to the strongest eligible candidate
- Format: "$5,799" with "WAS $9,990" struck-through next to it
- Attracts deal-seekers — strong direct response
- Requires city in Healthy Price Library (HR07)
- Eligible variants: A3.fixed_price, A4.fixed_price_pain, A7.fixed_price, A8 (when awarded)

### `no_price` — TRUST POSITIONING
- No pricing block at all
- Lets the photo, reviews, or premium aesthetic do the work
- Used where pricing would cheapen the message
- Used in: A3.premium variant, A10 trust ads (some variants)

## Pack-level balance

Layer 2 picks one fixed-price slot per pack. Audit after all L2 calls finish — if more than one ad got fixed-price treatment, downgrade the weaker ones to per-week.

Distribution target across a pack of 25 ads:
- ~80% per-week pricing
- ~5% fixed-price (1 ad)
- ~15% no-price (trust + premium)

## Healthy Price Library structure

City-keyed. Each row:

| Column | Example | Used for |
|---|---|---|
| city | Brisbane | Lookup key |
| fixed_price | $5,799 | The actual installed price for fixed-price ads |
| rrp_struck_through | $9,990 | Higher anchor price shown crossed-out — creates the discount visual |
| per_week_price | $56 | Per-week default for all per-week ads |
| rebate_amount | $1,200 | State/government rebate (when applicable) |

## Current price library (sample)

| City | Fixed price | RRP (struck-through) | Per-week | Rebate |
|---|---|---|---|---|
| Sydney |  |  | $59 |  |
| Melbourne |  |  | $56 |  |
| Brisbane |  |  | $54 |  |
| Perth |  |  | $58 |  |
| Adelaide |  |  | $53 |  |
| Newcastle |  |  | $55 |  |
| Central Coast |  |  | $57 |  |
| Hunter Valley |  |  | $54 |  |
| Wollongong |  |  | $56 |  |
| Gold Coast |  |  | $58 |  |
| Sunshine Coast |  |  | $55 |  |
| Geelong |  |  | $52 |  |
| Ballarat |  |  | $51 |  |
| Bendigo |  |  | $53 |  |
| Northern Melbourne |  |  | $56 |  |
| Carrum Downs |  |  | $57 |  |
| Ballina / Lennox Head / Byron Bay |  |  | $58 |  |
| Far North Coast |  |  | $56 |  |
| Southern Highlands / Macarthur |  |  | $54 |  |

_(19 cities total in spec — see `tradie_force_spec.json` for the full list)_

## What happens when a city isn't in the library

- Per-week ads still fire (default per-week price applied)
- Fixed-price variants do NOT generate (HR07)
- A1, A2, A3 premium/value, A5, A6, A8 (per-week mode), etc still work fine
- A4 fixed_price_pain, A7 fixed_price, A3 fixed_price all skip generation

## How Bray adds a new city

1. Open the spec tool (`09_INTERACTIVE_TOOLS/tradie_force_ad_spec.html`)
2. Scroll to "Healthy Price Library"
3. Add a new row with city name, fixed price, RRP, per-week, rebate
4. Export the JSON
5. Drop into the production repo, deploy

## How discount badges work

- Discount % shown on A6 / A9 ads is set by `client.default_promo_pct` in the onboarding form
- Editable per launch (the operator can adjust before publishing)
- Must match a real promo (HR09)

## Rebate framing

Some states have ducted A/C rebates (e.g. Victoria's VEU, NSW Energy Savings Scheme). When `rebate_amount` is set for a city, A6 / A8 variants can incorporate "Plus $X rebate available" framing. Layer 2 chooses whether to lean into this based on the variant tone.
