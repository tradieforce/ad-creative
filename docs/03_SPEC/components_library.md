# Components Library

Master catalogue of image assets. Layer 2 references these by name. Layer 3 receives them as image inputs (attached to the gpt-image-1 call).

Total: 45 components across 9 categories.

## Asset types

- **locked** — Must be uploaded as real image. AI never invents these. (House diagrams, condensers, brand logos, trust badges.)
- **stock** — Pre-uploaded library. AI uses as-is. (Family photos, reaction models — could be sourced from stock photography.)
- **fresh** — AI generates each time. Rare. Used only for stock-style elements where AI is reliable (backgrounds, decorative props).

## Bray's onboarding workflow

For a new client, the locked components and stock library should already be filled out (one-time agency-level setup). Only client-specific assets (team_photo, owner_photo, van_photo) are uploaded per-client.

Use the spec tool (`09_INTERACTIVE_TOOLS/tradie_force_ad_spec.html`) to upload component assets. The tool stores base64 in localStorage; export the JSON when complete to populate the production system.

## Catalogue

### Brand logo (12)

| Name | Type | Slot |
|---|---|---|
| ? | locked |  |
| ? | locked |  |
| ? | locked |  |
| ? | locked |  |
| ? | locked |  |
| ? | locked |  |
| ? | locked |  |
| ? | locked |  |
| ? | locked |  |
| ? | locked |  |
| ? | locked |  |
| ? | locked |  |

### Condenser (7)

| Name | Type | Slot |
|---|---|---|
| ? | locked |  |
| ? | locked |  |
| ? | locked |  |
| ? | locked |  |
| ? | locked |  |
| ? | locked |  |
| ? | locked |  |

### Controller (3)

| Name | Type | Slot |
|---|---|---|
| ? | locked |  |
| ? | locked |  |
| ? | locked |  |

### Ducting (2)

| Name | Type | Slot |
|---|---|---|
| ? | locked |  |
| ? | locked |  |

### House diagram (4)

| Name | Type | Slot |
|---|---|---|
| ? | locked |  |
| ? | locked |  |
| ? | locked |  |
| ? | locked |  |

### Outlet (5)

| Name | Type | Slot |
|---|---|---|
| ? | locked |  |
| ? | locked |  |
| ? | locked |  |
| ? | locked |  |
| ? | locked |  |

### Stock family (4)

| Name | Type | Slot |
|---|---|---|
| ? | stock |  |
| ? | stock |  |
| ? | stock |  |
| ? | stock |  |

### Stock reaction (6)

| Name | Type | Slot |
|---|---|---|
| ? | stock |  |
| ? | stock |  |
| ? | stock |  |
| ? | stock |  |
| ? | stock |  |
| ? | stock |  |

### Trust badge (2)

| Name | Type | Slot |
|---|---|---|
| ? | locked |  |
| ? | locked |  |

---

## How components flow through the pipeline

1. **Upload (one-time, by Bray)** — Bray uploads each locked component via the spec tool. Asset metadata gets persisted; image goes to S3.

2. **Spec references by name** — Each archetype's `components[]` field references components by category + name (or by slot description).

3. **Layer 1 resolves** — At manifest-time, Layer 1 looks up each required component, finds the matching asset in S3, attaches the URL to the ad job.

4. **Layer 2 attaches** — When composing the prompt, Layer 2 receives the component URLs, fetches them as base64, attaches them to the Anthropic API call as image inputs (so it can analyse them visually).

5. **Layer 3 attaches** — Layer 2's output specifies which components to attach to the ChatGPT image-gen call. These are passed as image inputs to gpt-image-1.

## Failure modes

- **Asset missing** — Layer 1 must fail fast and report which component is missing. Don't generate a manifest with missing required components.
- **Asset uploaded but wrong** (e.g. wrong condenser variant) — caught at review time. Bray re-uploads. The fix is to update the asset record's S3 URL.
- **Asset orphaned** (in spec but never uploaded) — admin UI surfaces "missing" status; Bray uploads.

## Priority components for first client

If everything's missing, prioritise in this order (highest-leverage):

1. **House diagrams** — used in A4 diagram, A5, A8. Critical because AI cannot draw these correctly (proven by 4 failed attempts).
2. **Brand logos** — Daikin, MHI, Mitsubishi Electric, Samsung. Used across the pack.
3. **Stock condensers** — at least one double-fan ducted condenser image per major brand.
4. **Stock reactions** — sweating-man, freezing-family for A5/A6.
5. **Stock family / lifestyle** — for A1, A2, A3.
6. **Trust badges** — Google G logo template, 5-star rating template.
