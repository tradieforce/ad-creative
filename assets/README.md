# /assets — uploaded images

All uploaded images live here. Folder layout matches the spec — when uploads land via the UI, they should be placed in the corresponding subfolder.

## Folder map

```
assets/
├── reference-ads/                 ← per-archetype locked reference (10 folders, pre-populated)
│   ├── A1-energy-bill-hero/
│   ├── A2-speed-guarantee/
│   ├── A3-luxury-lifestyle/
│   ├── A4-problem-solution/
│   ├── A5-seasonal-pain/
│   ├── A6-seasonal-sale/
│   ├── A7-city-massive-sale/
│   ├── A8-localised-clearance/
│   ├── A9-holiday-event/
│   └── A10-local-trust/
│
├── components/                    ← global component library by category
│   ├── condensers/                ← cond_neutral_1.png, cond_daikin.png, etc
│   ├── house-diagrams/
│   ├── outlets/
│   ├── controllers/
│   ├── ducting/
│   ├── stock-family/
│   ├── stock-reaction/
│   ├── brand-logos/
│   └── trust-badges/
│
├── client-uploads/                ← per-client uploaded photos
│   └── {client-slug}/             ← team-1.png, owner-1.png, van-1.png, lifestyle-1.png
│
└── generated-ads/                 ← final ChatGPT-generated PNGs
    └── {client-slug}/
```

## Naming conventions

- **Reference ads:** `assets/reference-ads/{archetype-slug}/reference.png` (one per archetype)
- **Components:** `assets/components/{category}/{component-key}.png` (key matches `data/components.json`)
- **Client uploads:** `assets/client-uploads/{client-slug}/{photo-type}-{n}.png` where `photo-type ∈ {team, owner, van, lifestyle, reaction, bill-holder}`
- **Generated ads:** `assets/generated-ads/{client-slug}/{ad-id}.png` (ad-id matches `data/ads.json`)

## What's pre-populated vs needs uploading

- ✅ `reference-ads/` — locked per-archetype references already copied in (one per archetype)
- ❌ `components/` — placeholders only, real images need to be uploaded
- ❌ `client-uploads/` — empty until a real client onboards
- ❌ `generated-ads/` — empty until ChatGPT integration is wired
