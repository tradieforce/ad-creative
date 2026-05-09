# 17 Hard Rules

These are non-negotiable rules that apply to every ad regardless of archetype. Layer 2 enforces them inline (writes them into the composed prompt). Layer 1 enforces structural ones (e.g. fixed-price ads only fire if city in price library, per HR07).

Source of truth: `tradie_force_spec.json` → `globalRules[]`.

### HR01

NEVER include the text "0% interest" anywhere on the ad. "$0 upfront" and "interest-free finance available" are acceptable.

### HR02

All technical components (condensers, outlets, ducting, controllers, house diagrams) MUST come from the Components Library and be supplied to ChatGPT as locked image attachments. AI never invents these from scratch.

### HR03

Condensers shown MUST be the double-fan ducted version. Single-fan = split system, wrong product.

### HR04

NEVER use AI-generated faces. Use only stock photos from the Components Library or client-uploaded photos.

### HR05

Maximum 3 brand logos in the brand strip for direct-response ads. 2 brand logos for premium/trust positioning. Never the agency or client company logo on the creative.

### HR06

PRICING MIX: Per-week pricing is the default (promotes finance, generates the agency's finance-clip revenue). Layer 2 selects ONE archetype per pack to carry the fixed-price treatment (attracts deal-seekers — client must be ready to handle the price-related questions). Some trust-led ads carry NO price. Layer 2 balances this mix when composing the pack.

### HR07

Fixed-price ads can only be composed when {{city}} exists in the Healthy Price Library (the city has a fixed price set).

### HR08

Google review badge appears ONLY when {{google_review_count}} ≥ 30. Trust ad (A10) still fires below 30 reviews — just without the review badge.

### HR09

Discount % shown on badges MUST match the real promo the client is currently running. Editable per launch.

### HR10

Default output is square 1080×1080 for Meta feed. A9 heavy holiday variant uses 1080×1350 portrait. No other variants override the square ratio.

### HR11

Headline text must be high-contrast, bold, large enough to read at thumbnail size.

### HR12

All copy in Australian English ('colour' not 'color', '$' for AUD).

### HR13

CLARITY RULE: The product category — 'DUCTED AIR CONDITIONING', 'DUCTED A/C', or 'DUCTED HEATING & COOLING' — MUST appear prominently in the headline or sub-headline. A scroller must know what's being sold within 1 second. Premium aesthetic does not override this.

### HR14

SAFE-ZONE RULE: Maintain ~60px padding inside all four edges. No headlines, badges, CTAs, or critical text within this margin. Brand strip may sit close to but not touching the bottom edge. Protects against Meta's auto-cropping in feed/Stories/Reels.

### HR15

TEXT SIZE RULE: Every text element must be readable at thumbnail size on mobile. Badges, labels, and supporting text are NOT decorative footnotes — they must be sized to be read. If text is decorative-small, it has failed.

### HR16

VISION-BASED COMPOSITION: Layer 2 must analyse all attached asset images visually before composing the prompt. For ads with client photos (A10, A2 lifestyle, A3 lifestyle), palette is dictated by what's visible in the photo (client branding, mood, lighting) — not invented.

### HR17

ALL ARCHETYPES (except A10) ALWAYS FIRE for every client. Holiday variants (A9), seasonal variants (A5, A6), and pricing variants (per-week / fixed / no-price) are all generated upfront from day one. Launch each as the date or season approaches. A10 conditional only on photo availability.

---

## Hard-rule decision matrix

| Rule | Enforced by | When |
|---|---|---|
| HR01 (no "0% interest") | Layer 2 | Inline in every composed prompt as instruction |
| HR02 (locked components only) | Layer 1 + Layer 2 | L1 fails fast if asset missing; L2 instructs ChatGPT to use attached components |
| HR03 (double-fan condensers) | Layer 1 | Component library only contains double-fan condensers |
| HR04 (no AI faces) | Layer 2 | Inline instruction; no archetype prompt asks AI to draw a face |
| HR05 (max brand logos) | Layer 1 + Layer 2 | L1 caps brands at 3 (or 2 for premium); L2 inlines the cap |
| HR06 (one fixed-price per pack) | Layer 2 | L2 awards the slot; pack-level audit verifies after |
| HR07 (city in price library) | Layer 1 | L1 doesn't fire fixed-price variants if city missing |
| HR08 (Google badge gating) | Layer 2 | L2 omits the badge from composition if review_count < 30 |
| HR09 (real promo %) | Operator | Manual — Bray sets the actual promo per launch |
| HR10 (output dimensions) | Layer 2 + Layer 3 | L2 specifies dimensions; L3 enforces |
| HR11 (high-contrast headlines) | Layer 2 | Inline in prompt |
| HR12 (Australian English) | Layer 2 | Inline in prompt |
| HR13 (CLARITY rule) | Layer 2 | Inline in prompt; archetype variable_inputs already include the product term |
| HR14 (60px safe zone) | Layer 2 | Inline in prompt |
| HR15 (text size readable) | Layer 2 | Inline in prompt |
| HR16 (vision-based composition) | Layer 2 | Architecture-level — L2 system prompt requires image inputs |
| HR17 (always-fires architecture) | Layer 1 | All archetypes always fire except A10 (photo-conditional) |
