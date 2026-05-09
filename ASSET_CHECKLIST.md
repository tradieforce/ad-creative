# Asset Checklist

What Bray needs to upload to fully populate the admin tool. Walk through this with Claude Code.

---

## 1. Reference ads (10 needed)

One reference ad per archetype. The package already includes the historical Tradie Force references that have been validated through testing. Bray may want to swap some of these for newer/better-performing ads.

| Archetype | Locked reference | Status | Folder |
|---|---|---|---|
| A1 — Energy Bill Hero | A03 (energy savings hero) | ✅ included | `assets/reference-ads/A1-energy-bill-hero/` |
| A2 — Speed Guarantee | A02 (install speed pledge) | ✅ included | `assets/reference-ads/A2-speed-guarantee/` |
| A3 — Luxury Lifestyle | A01 (Luxury Heating piggyback) | ✅ included | `assets/reference-ads/A3-luxury-lifestyle/` |
| A4 — Problem/Solution Urgency | A04 | ✅ included | `assets/reference-ads/A4-problem-solution/` |
| A5 — Seasonal Pain | A08 (sweating-man reaction) | ✅ included | `assets/reference-ads/A5-seasonal-pain/` |
| A6 — Seasonal Sale Event | A13 | ✅ included | `assets/reference-ads/A6-seasonal-sale/` |
| A7 — City Massive Sale | A19 (condenser hero) | ✅ included | `assets/reference-ads/A7-city-massive-sale/` |
| A8 — Localised Clearance | A16 | ✅ included | `assets/reference-ads/A8-localised-clearance/` |
| A9 — Holiday Event | A33 | ✅ included | `assets/reference-ads/A9-holiday-event/` |
| A10 — Local Trust | A37 (team photo trust ad) | ✅ included | `assets/reference-ads/A10-local-trust/` |

The locked references that have been validated through testing are pre-populated in each archetype folder. If Bray wants to swap one for a newer/better-performing ad, drop a new file in the relevant `assets/reference-ads/{archetype-slug}/` folder.

---

## 2. Components (45 records, mostly missing images)

Component records exist in `data/components.json` but most need actual image uploads. Categories below:

### Condensers (5 records)
- [ ] `cond_neutral_1` — Double-fan, no brand. Default.
- [ ] `cond_neutral_2` — Double-fan, no brand. Variation.
- [ ] `cond_daikin` — Branded for Daikin clients.
- [ ] `cond_mitsubishi` — Branded for Mitsubishi/MHI.
- [ ] `cond_samsung` — Branded for Samsung.

Folder: `assets/components/condensers/`

### House diagrams (4 records)
- [ ] `house_3d_blue` — A1 hero
- [ ] `house_diagram_simple` — A1 alternate
- [ ] `house_cutaway` — A4 / A5 explainer accent
- [ ] `house_isometric` — alternate for diagram-led ads

Folder: `assets/components/house-diagrams/`

### Outlets (3-4 records)
- [ ] `outlet_white_round` — standard ceiling outlet
- [ ] `outlet_grille` — grille variant
- [ ] `outlet_designer` — premium / A3 use

Folder: `assets/components/outlets/`

### Controllers (3-4 records)
- [ ] `controller_wall_white` — standard wall touchscreen
- [ ] `controller_zoning` — zoning controller
- [ ] `controller_smart` — smart/app variant

Folder: `assets/components/controllers/`

### Ducting (2-3 records)
- [ ] `ducting_overview` — for diagram ads
- [ ] `ducting_isometric` — alternate

Folder: `assets/components/ducting/`

### Stock family photos (6-8 records)
- [ ] `family_lounge_1` — A2 / A3 lifestyle warm
- [ ] `family_lounge_2` — alternate
- [ ] `family_kitchen_1` — kitchen scene
- [ ] `family_couples_1` — couple, premium feel
- [ ] etc.

Folder: `assets/components/stock-family/`

### Stock reaction photos (6-8 records)
- [ ] `reaction_sweating_man_1` — A5 summer pain
- [ ] `reaction_sweating_woman_1` — alternate
- [ ] `reaction_cold_man_1` — winter pain (A5 winter variant)
- [ ] `reaction_frustrated_bill` — A1 bill-holder
- [ ] etc.

Folder: `assets/components/stock-reaction/`

### Brand logos (9 records)
Native brand colours, transparent PNG.
- [ ] `daikin` — Daikin logo
- [ ] `mhi` — Mitsubishi Heavy Industries logo
- [ ] `mitsubishi_electric` — Mitsubishi Electric logo
- [ ] `samsung` — Samsung logo
- [ ] `fujitsu` — Fujitsu logo
- [ ] `hisense` — Hisense logo
- [ ] `panasonic` — Panasonic logo
- [ ] `lg` — LG logo
- [ ] `toshiba` — Toshiba logo

Folder: `assets/components/brand-logos/`

### Trust badges (3-4 records)
- [ ] `google_g_color` — official Google G in multi-colour palette
- [ ] `gold_star` — single gold star icon (for review badges)
- [ ] `verified_badge` — generic verified mark

Folder: `assets/components/trust-badges/`

---

## 3. Client uploads (per-client, accumulates over time)

Don't upload until a real client onboards. When that happens:

For each client (multiple of each type allowed):
- [ ] Team photos (group of installers)
- [ ] Owner photos (face of the business)
- [ ] Van / vehicle photos
- A10 (Local Trust) fires if **any one** of the above is uploaded.
- [ ] Reaction photo — rare, mostly use stock

Folder: `assets/client-uploads/{client-slug}/`

The mock data has 3 clients (Sharp Air Conditioning, Cool Breeze Brisbane, Alpine Air Melbourne) — these are placeholder records, not real clients.

---

## 4. Generated ads (zero needed yet)

Don't pre-populate. These get created automatically when Claude + ChatGPT actually run (after the tech guy connects the APIs). They land in `assets/generated-ads/{client-slug}/{ad-id}.png`.

---

## How to upload (with Claude Code's help)

Two ways:

**Option 1 — drop files in directly.** Tell Claude Code "save this as the daikin brand logo" and attach the image. Claude Code places it at `assets/components/brand-logos/daikin.png` and updates `data/components.json` to point at it.

**Option 2 — use the UI.** Once Claude Code wires up the upload mechanism (Phase 1 of `HANDOFF_FOR_CLAUDE_CODE.md`), open `ui/index.html`, navigate to Components, click "+ Upload new component" or "Upload image" on existing cards, and pick the file. Persists to disk + updates data automatically.

Recommend Option 2 once Phase 1 is working — fewer chances to misplace files.
