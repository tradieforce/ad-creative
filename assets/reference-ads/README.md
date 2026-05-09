# /assets/reference-ads — per-archetype locked references

Each archetype has a single locked reference ad. ChatGPT receives this image as IMAGE 1 every time that archetype generates. Layer 2 (Claude) tells ChatGPT to "match the visual energy and density of this ad — don't copy specifics."

## Archetype → reference mapping

| Archetype | Folder | Default reference |
|---|---|---|
| A1 — Energy Bill Hero | `A1-energy-bill-hero/` | A03 |
| A2 — Speed Guarantee | `A2-speed-guarantee/` | A02 |
| A3 — Luxury Lifestyle | `A3-luxury-lifestyle/` | A01 |
| A4 — Problem/Solution | `A4-problem-solution/` | A04 |
| A5 — Seasonal Pain | `A5-seasonal-pain/` | A08 |
| A6 — Seasonal Sale | `A6-seasonal-sale/` | A13 |
| A7 — City Massive Sale | `A7-city-massive-sale/` | A19 |
| A8 — Localised Clearance | `A8-localised-clearance/` | A16 |
| A9 — Holiday Event | `A9-holiday-event/` | A33 |
| A10 — Local Trust | `A10-local-trust/` | A37 |

## To swap a reference

Replace the file inside the archetype folder with the new chosen ad. After swapping, you may also want to update the archetype's rules and variable inputs to match the new visual style.
