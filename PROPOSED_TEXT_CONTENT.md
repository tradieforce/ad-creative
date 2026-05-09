# Proposed text additions — for review

> Tight scope: variable-input pool expansions, focused on **visual hero options** (the combinatorial bottleneck) plus modest additions to other thin pools. **No schema changes, no new rules, no rename of A4.** Existing global rules respected as-is.
>
> **Tradesman / owner / team / van imagery is client-uploads-only** per your direction. Nothing in this proposal references stock tradesmen.
>
> Mark each item: `[A]` approve, `[R]` reject, or `edit:` to change. I'll apply only the approved items in one pass.

---

## 1. A2 Speed Guarantee — 2 new visual hero options (current 4 → 6)

A2 already runs two funnel variants (Cold/Warm explainer mood vs Warm/Hot direct-response mood). These two additions give the photo pool clear mood options for each:

1. `[ ]` "Bright daylight family scene — couple at laptop OR mum-and-toddler in kitchen, mid-morning light (uses `fam_couple_laptop` or `fam_mum_kitchen`). Cold/Warm explainer mood."
2. `[ ]` "Evening domestic couple on couch with warm interior lighting (uses `fam_couple_evening`). Warm/Hot direct-response mood."

---

## 2. A6 Seasonal Sale Event — NEW visual hero options pool (8 items)

A6 currently has no hero pool, which is why it feels samey. All 8 use existing components or items that fall within already-allowed categories (reactions = customers, condensers = locked components, house diagrams = locked components, atmospheric backdrops = no people).

1. `[ ]` "Sweating man (uses existing `react_sweating_man`) — left half edge-to-edge, hot palette overlay. Summer / heatwave variants."
2. `[ ]` "Cold woman (uses existing `react_cold_woman`) — left half edge-to-edge, cool palette overlay. Winter sale / cool upgrade variants."
3. `[ ]` "Freezing family (uses existing `react_freezing_fam`) — left half edge-to-edge. Winter sale variant."
4. `[ ]` "Woman pointing up at price (uses existing `react_pointing_up`) — sale-energy direct-response feel."
5. `[ ]` "**Locked condenser** from components library (`cond_neutral_1` / `cond_neutral_2` / brand-matched) — double-fan ducted only, right side ~40% canvas, prominent discount badge overlay. Direct-response sale variant. AI must not generate or modify the condenser."
6. `[ ]` "House diagram (locked component `house_3d_blue`) — centre-left medium scale, discount overlay. Whole-home upgrade angle."
7. `[ ]` "Reaction model + **locked condenser** split-screen — left half person, right half product (locked component, double-fan ducted, AI never generates the condenser). Strong before/after feel."
8. `[ ]` "Outdoor heatwave atmospheric (uses `outdoor_heatwave_sunset`) + reaction model inset bottom-left. Heatwave variant only."

---

## 3. A6 Seasonal Sale Event — 2 more value stacks (current 4 → 6)

1. `[ ]` "End-of-Season Pricing | $0 Upfront | 5-Year Workmanship Guarantee"
2. `[ ]` "50% OFF This Season Only | Locally Installed | Premium Brands | $1,299 in Free Bonuses"

---

## 4. A7 Brand Sale — 2 new visual hero options (current 3 → 5)

In both options the condenser MUST be a locked component from the library (one of `cond_neutral_1`, `cond_neutral_2`, `cond_daikin`, `cond_mitsubishi`, `cond_samsung`, `cond_fujitsu`, `cond_with_ducting`) — double-fan ducted version only per HR02 + HR03. AI never generates the condenser; it composites the locked image onto the backdrop, palette/tint adjustments only.

1. `[ ]` "**Locked condenser** (from components library) composited onto a bright sky-blue + green grass outdoor backdrop (uses `outdoor_sky_grass`). Heritage palette — optimistic outdoor mood. Condenser shape/fans/branding/proportions unchanged."
2. `[ ]` "**Locked condenser** (from components library) on a neutral cream / soft-grey studio backdrop — premium-feel variant. No outdoor scene. Condenser shape/fans/branding/proportions unchanged."

---

## 5. A9 Holiday Event — NEW visual hero options pool (6 items)

The old "tradesman portrait heavy variant" referenced stock tradesman imagery — replaced with options that either use atmospheric backdrops, gate on client uploads, or lean on type/condenser.

1. `[ ]` "Holiday name as oversized type-led hero (CHRISTMAS / BLACK FRIDAY / BOXING DAY / EASTER / AUSTRALIA DAY / NEW YEAR) — typography dominates the canvas, no photographic hero. Heavy 1080×1350 portrait variant works well."
2. `[ ]` "**Locked condenser** from components library (`cond_neutral_1` / `cond_neutral_2`) ~50% canvas + festive accent (snowflakes / fireworks / sun rays / pastel) overlay. Clean square variant. Condenser shape/fans/branding unchanged — AI never generates the condenser."
3. `[ ]` "Holiday backdrop (uses `holiday_xmas_bg` / `holiday_nye_bg` / `holiday_easter_bg` / `holiday_boxing_day_bg` / `holiday_blackfriday_bg` / `holiday_australia_day_bg`) atmospheric — **locked condenser** (from components library, double-fan ducted only) inset bottom-right."
4. `[ ]` "Holiday backdrop alone with prominent type overlay — no product shot, the backdrop carries the mood."
5. `[ ]` "Calendar fragment / countdown-timer hero with date overlay — urgency feel, atmospheric only, no stock people."
6. `[ ]` "Owner / team / van photo from CLIENT UPLOADS only (when client has uploaded owner_photo, team_photo, or van_photo). Heavy variant in the spirit of A10. **If client has no uploaded photo, this hero option is skipped — A9 falls back to options 1-5.**"

---

## 6. A9 Holiday Event — 2 more value stacks (current 4 → 6)

1. `[ ]` "Holiday Special Pricing | $0 Upfront | 5-Year Workmanship Guarantee"
2. `[ ]` "Limited Holiday Stock | Premium Brands | Locally Installed | $1,299 in Free Bonuses"

---

## 7. A10 Local Trust — NEW visual hero options pool (5 items, all gated on client uploads)

A10 already only fires when the client has team / owner / van photos. These options just give Master AI structured choices for which photo to lead with. **Zero stock requirements** — every option is conditional.

1. `[ ]` "Team-on-van photo (full-canvas, palette derived from photo) — when client has uploaded a team+van combined photo. Strongest single hero."
2. `[ ]` "Owner portrait (left-half full-bleed) — when client has uploaded an owner_photo as their strongest single shot."
3. `[ ]` "Van photo with team standing alongside (full-canvas environmental) — when client has uploaded both team_photo and van_photo separately."
4. `[ ]` "Group team photo in shop / warehouse / depot (full-canvas environmental) — when team_photo is a workplace-context group shot."
5. `[ ]` "Single tradesman / installer at work on a job site (full-canvas) — when client has uploaded a single staff member shot rather than a group."

**If client has none of the above:** A10 doesn't fire (existing rule, unchanged).

---

## 8. A10 Local Trust — 2 more value stacks (current 4 → 6)

1. `[ ]` "Family Owned & Operated | {{years_in_business}} Years Serving {{region}} | Australian Owned | 5-Year Workmanship Guarantee"
2. `[ ]` "Trusted Locally for {{years_in_business}} Years | {{google_review_count}}+ 5-Star Reviews | Licensed & Insured | Premium Brands"

---

## 9. A5 Seasonal Pain — 2 more value stacks (current 4 → 6)

1. `[ ]` "Banish Summer Heat | Smart Zoning | $0 Upfront | 5-Year Workmanship Guarantee"
2. `[ ]` "End the Winter Cold | Whole-Home Comfort | Locally Installed | $1,299 in Free Bonuses"

---

## 10. Component records to create — placeholders for Codex image acquisition

These are **records only** — empty placeholders until Codex drops the actual images into `assets/components/{cat}/{key}.{ext}`. Categories all follow the existing schema (Stock family, Stock reaction, plus three new categories: Stock bill/finance, Holiday backdrop, Outdoor backdrop).

**Stock bill/finance (5 records, NEW category):**
1. `[ ]` `bill_holder_man` — middle-aged Australian man holding electricity bill, mildly frustrated. usedBy: [A1, A4]
2. `[ ]` `bill_holder_woman` — middle-aged Australian woman holding bill, frustrated. usedBy: [A1, A4]
3. `[ ]` `wallet_coins` — wallet with coins falling out, dark dramatic side-light. NO PEOPLE. usedBy: [A4]
4. `[ ]` `savings_graph` — bill or chart with downward arrow showing savings. usedBy: [A1]
5. `[ ]` `bill_shock_red` — bill with red shock/highlight elements. usedBy: [A4]

**Stock family (7 new records, complementing 4 existing):**
6. `[ ]` `fam_couple_laptop` — couple researching with laptop, bright daylight. usedBy: [A2, A3]
7. `[ ]` `fam_couple_evening` — couple on couch evening warm light, premium feel. usedBy: [A3]
8. `[ ]` `fam_dinner_table` — family at dinner table, modern Australian home. usedBy: [A2, A3]
9. `[ ]` `fam_kids_playing` — kids playing in living room. usedBy: [A2]
10. `[ ]` `fam_couple_reading` — couple relaxed reading, quiet luxury. usedBy: [A3]
11. `[ ]` `fam_mum_kitchen` — mum + toddler in modern kitchen. usedBy: [A3]
12. `[ ]` `fam_dog_lounge` — family / couple with dog in lounge. usedBy: [A3]

**Stock reaction (5 new records, complementing 6 existing):**
13. `[ ]` `react_sweating_woman` — woman fanning self, hot, indoor. usedBy: [A5, A6]
14. `[ ]` `react_couple_freezing` — couple bundled up under blankets, cold. usedBy: [A5, A6]
15. `[ ]` `react_frustrated_bill` — person reacting / shocked at bill. usedBy: [A1, A4]
16. `[ ]` `react_elderly_cold` — elderly person uncomfortably cold at home. usedBy: [A5]
17. `[ ]` `react_thumbs_up_summer` — person thumbs-up satisfied in cool home. usedBy: [A6]

**Holiday backdrop (6 records, NEW category, NO PEOPLE):**
18. `[ ]` `holiday_xmas_bg` — Christmas atmosphere (lights, warm bokeh). usedBy: [A9]
19. `[ ]` `holiday_nye_bg` — fireworks against night sky. usedBy: [A9]
20. `[ ]` `holiday_easter_bg` — pastel spring atmosphere. usedBy: [A9]
21. `[ ]` `holiday_boxing_day_bg` — Australian summer beach atmosphere. usedBy: [A9]
22. `[ ]` `holiday_blackfriday_bg` — black/red high-contrast abstract backdrop. usedBy: [A9]
23. `[ ]` `holiday_australia_day_bg` — Australian iconic outdoor (red dirt / coast). usedBy: [A9]

**Outdoor backdrop (4 records, NEW category, NO PEOPLE):**
24. `[ ]` `outdoor_sky_grass` — bright Australian sky + green grass. usedBy: [A7]
25. `[ ]` `outdoor_suburban_aus` — Australian suburban street with home in foreground. usedBy: [A8]
26. `[ ]` `outdoor_modern_home` — modern Australian home exterior afternoon light. usedBy: [A1, A2]
27. `[ ]` `outdoor_heatwave_sunset` — Australian heatwave sunset atmospheric. usedBy: [A5, A6]

---

## 11. Existing component flagged for your decision

`react_tradesman` (currently in `data/components.json`):
- Description: "Tradesman thumbs-up portrait."
- Category: Stock reaction
- usedBy: [A9]
- imagePath: null (no image attached yet)

This is a stock tradesman record — violates your "tradesman/owner/team imagery must be client-uploads only" direction. Three options:

`[ ]` Remove the record entirely. A9's hero options (Section 5 above) replace its role.

`[ ]` Keep the record but blank `usedBy: []` (orphan it in the library). Future you can decide.

`[ ]` Leave as-is for now (your call later).

---

## How to send back

Mark each `[ ]` item, or just give me a bulk decision:
- "Approve all" — I apply everything
- "Approve all except X, Y" — I skip those
- "Reject sections 1-3, approve 4-onward" — works too

Once you sign off, I apply only the approved items to `data/`. Server already running on http://localhost:3000.
