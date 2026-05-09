# /assets/components — global component library

Component records are defined in `data/components.json`. The actual image files go in this folder, organized by category.

The `key` field in each component record is the filename. So component `cond_daikin` of category `Condenser` lives at `assets/components/condensers/cond_daikin.png`.

## Categories (from spec)

- `condensers/` — outdoor units (always double-fan ducted, per HR03)
- `house-diagrams/` — 3D cutaways, isometric house views
- `outlets/` — ceiling vents, grilles
- `controllers/` — wall touchscreens, smart controls
- `ducting/` — internal ducting illustrations
- `stock-family/` — lifestyle photos (premium, family scenes)
- `stock-reaction/` — pain/reaction photos (sweating, frustrated)
- `brand-logos/` — brand-specific logos (Daikin, MHI, Samsung, etc), native colours
- `trust-badges/` — Google reviews, verified badges

## Hard rule HR02

> All technical components (condensers, outlets, ducting, controllers, house diagrams) MUST come from this library and be supplied to ChatGPT as locked image attachments. AI never invents these from scratch.

This is why the components library exists — to guarantee visual consistency across all ads. Don't bypass it.

## Hard rule HR04

> Never use AI-generated faces. Use only stock photos from this library or client-uploaded photos.

Stock-family and stock-reaction photos go here. Real client photos go in `client-uploads/`.

## Hard rule HR03

> Condensers shown MUST be the double-fan ducted version. Single-fan = split system, wrong product.

Don't upload single-fan condensers to `condensers/`. Wrong product entirely.
