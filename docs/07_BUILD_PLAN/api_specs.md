# API Endpoints

REST endpoints. JSON in/out. Auth via JWT or session cookie (single-operator scope OK for v1).

## Health

### `GET /health`
Returns 200 OK if app is healthy. Used by deployment platform for liveness probes.

```json
{ "status": "ok", "spec_version": "1.0", "spec_loaded_at": "2025-..." }
```

---

## Clients

### `POST /api/clients`
Onboard a new client.

**Body (multipart/form-data):**
- business_name: string
- city: string
- region: string (optional)
- google_review_count: int
- brands_installed: string[]
- default_promo_pct: int
- team_photo: file (optional)
- owner_photo: file (optional)
- van_photo: file (optional)
- notes: string (optional)

**Response 201:**
```json
{ "client_id": "uuid", "uploaded_assets": ["asset_id_1", "asset_id_2"] }
```

### `GET /api/clients`
List clients.

**Query:**
- `q`: search by business_name
- `city`: filter

**Response 200:**
```json
{ "clients": [{ "id": "...", "business_name": "...", ... }] }
```

### `GET /api/clients/:id`
Single client.

**Response 200:**
```json
{
  "client": { ... },
  "uploaded_photos": [{ "type": "team_photo", "url": "..." }, ...],
  "packs": [{ "id": "...", "status": "...", "generated_at": "..." }]
}
```

### `PATCH /api/clients/:id`
Update client. Same fields as POST.

---

## Packs

### `POST /api/packs`
Trigger pack generation for a client.

**Body:**
```json
{ "client_id": "uuid" }
```

**Response 202:**
```json
{ "pack_id": "uuid", "status": "generating", "ad_count": 25 }
```

This endpoint:
1. Reads client from DB
2. Reads spec from memory
3. Runs Layer 1 → produces manifest
4. Inserts pack + ads rows
5. Enqueues L2 jobs
6. Returns immediately (202)

The pack populates over the next ~5-10 min as L2 + L3 workers process.

### `GET /api/packs/:id`
Get pack status + all ads.

**Response 200:**
```json
{
  "pack": {
    "id": "...",
    "client_id": "...",
    "status": "review",
    "total_ad_count": 25,
    "fixed_price_awarded": "A4.fixed_price_pain",
    "funnel_distribution": { "cold_warm": 0.32, "warm_hot": 0.48, "hot": 0.20 },
    "total_cost_usd": 11.42,
    "generated_at": "..."
  },
  "ads": [{ "id": "...", "archetype_code": "A1", "status": "approved", ... }]
}
```

### `GET /api/packs/:id/manifest`
Returns the raw L1 manifest JSON. Useful for debugging.

### `POST /api/packs/:id/export`
Build a zip of approved ads.

**Response 200:**
```json
{ "zip_url": "https://signed-s3-url..." }
```

The zip contains:
- One PNG per approved ad: `{archetype}_{variant}_{ad_id}.png`
- A CSV manifest: `manifest.csv` with columns: filename, archetype, variant, headline, cta, funnel_stage, pricing_mode

---

## Ads

### `GET /api/ads/:id`
Get one ad with full detail.

**Response 200:**
```json
{
  "ad": { "id": "...", "archetype_code": "A4", ... },
  "l2_prompt_used": "Square 1080x1080 ducted...",
  "l2_reasoning_trace": "Pack already has...",
  "l3_image_url": "https://s3.../rendered.png",
  "components_attached": [{ "name": "...", "url": "..." }],
  "regeneration_history": [
    { "image_url": "...", "regenerated_at": "..." }
  ],
  "review_actions": [
    { "action": "regenerate", "created_at": "..." }
  ]
}
```

### `POST /api/ads/:id/approve`
Mark ad as approved.

**Body:** `{}`

**Response 200:** `{ "ad_id": "uuid", "status": "approved" }`

### `POST /api/ads/:id/reject`
Mark ad as rejected.

**Body:** `{ "reason": "string" }`

**Response 200:** `{ "ad_id": "uuid", "status": "rejected" }`

### `POST /api/ads/:id/regenerate`
Re-run Layer 3 with same composed prompt + new seed.

**Body:** `{}` (optional `prompt_override: "..."` for edit-prompt flow)

**Response 202:** `{ "job_id": "uuid", "status": "queued" }`

### `POST /api/ads/:id/recompose`
Re-run Layer 2 (then Layer 3).

**Body:** `{ "operator_note": "string" }` (optional — passed to L2 as additional context)

**Response 202:** `{ "job_id": "uuid", "status": "queued" }`

---

## Assets

### `POST /api/assets`
Upload a locked component, stock asset, or reference image.

**Body (multipart/form-data):**
- type: "locked_component" | "stock" | "reference_exemplar"
- name: string
- category: string
- file: file

**Response 201:**
```json
{ "asset_id": "uuid", "url": "..." }
```

### `GET /api/assets`
List assets.

**Query:**
- `type`: filter
- `category`: filter
- `client_id`: filter (for client uploads)

**Response 200:**
```json
{ "assets": [...] }
```

---

## Spec

### `GET /api/spec/status`
Spec metadata.

**Response 200:**
```json
{
  "spec_version": "1.0",
  "loaded_at": "2025-...",
  "archetype_count": 10,
  "hard_rule_count": 17,
  "component_count": 45,
  "price_library_count": 19
}
```

### `POST /api/spec/reload` (admin only)
Force spec reload from disk.

**Response 200:** `{ "reloaded_at": "..." }`

### `GET /api/spec/components/missing`
Returns components in spec that have no uploaded asset. Used by `/admin/components` UI to surface gaps.

**Response 200:**
```json
{ "missing": [{ "name": "MHI double-fan ducted condenser", "category": "Condenser" }] }
```

---

## Webhooks (Phase 2)

### `POST /webhooks/meta-upload-complete`
For Meta Marketing API integration. Triggered when an ad upload to Meta completes.

---

## Real-time updates

Subscribe via WebSocket or SSE for pack status updates:

### `WS /api/packs/:id/stream`
Pushes events as ads transition status:
```json
{ "event": "ad_rendered", "ad_id": "...", "image_url": "..." }
{ "event": "pack_ready", "pack_id": "..." }
```
