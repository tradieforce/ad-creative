# Tech Stack

The minimum viable backend. Each piece has a clear role; nothing is over-engineered.

## Core decisions

### Language: TypeScript (Node 20+) or Python 3.11+

Both work. Pick what your team knows.

**TypeScript advantages:**
- Single language across backend + UI (Next.js)
- Strong types prevent prompt-template bugs
- Anthropic + OpenAI SDKs are first-class

**Python advantages:**
- Better data manipulation if you do analytics
- More familiar for ML-leaning teams
- FastAPI is excellent

For a one-person agency with a small contractor build, **TypeScript is the lower-friction path** — single stack, fewer surfaces.

### Backend framework: Fastify or FastAPI

- **Fastify** (Node) — fast, minimal, good plugin ecosystem
- **FastAPI** (Python) — auto OpenAPI docs, good async support

Both work. Avoid Express (older), Flask (no async). Avoid heavy frameworks (Nest, Django) — overkill for this scope.

### Database: Postgres (via Supabase or self-hosted)

- Use Supabase for v1: managed Postgres + auth + storage in one. Free tier sufficient for early.
- Use Prisma (TS) or SQLAlchemy 2.0 (Py) for ORM
- Schema in `database_schema.sql`

### Asset storage: S3 or Cloudflare R2

- R2 is cheaper for our access pattern (high writes, low reads)
- S3 is more familiar; both have identical SDKs (R2 is S3-compatible)
- Public-read for locked components, signed URLs for client uploads + generated outputs

### Job queue: BullMQ (Redis)

- TS only. For Python, use Celery or RQ
- Why a queue: Layer 2 + Layer 3 are slow (5-15 sec) and external-API-dependent. Need retry, backoff, parallelism, dead-letter handling.
- Alternative: just use async/await with concurrency limits. Works for low volume but doesn't scale and has no retry observability.

### Review queue UI: Next.js (or Remix)

- Server-rendered, file-based routing
- Pages: `/onboarding`, `/clients/:id`, `/packs/:id`, `/admin/components`
- Recommend Tailwind + shadcn/ui for quick polish

### Image generation client: OpenAI SDK

- `gpt-image-1` model
- Multipart file inputs supported

### LLM client: Anthropic SDK

- `claude-opus-4-7` (default) or `claude-sonnet-4-6` (cost-opt)
- Vision via image inputs as base64
- **Prompt caching is critical** — enable on the system prompt block

### Error tracking: Sentry

- Logs L2 / L3 failures with full context (composed prompt, attached assets, response)
- Critical for tuning the system prompt

### Optional: Meta Marketing API (Phase 2)

- Phase 1: manual zip upload to Meta Ads Manager
- Phase 2: when volume justifies, automated push via Marketing API
- The agency owns the ad accounts; system just produces creative

## Service map

```
┌──────────────┐  HTTPS  ┌──────────────────┐
│   Browser    │────────▶│  Next.js App      │
│  (Bray's UI) │         │  (review queue)   │
└──────────────┘         └──────────┬───────┘
                                    │
                                    │ HTTP
                                    ▼
                         ┌──────────────────┐
                         │  Backend API     │
                         │  (Fastify/       │
                         │   FastAPI)       │
                         └──────┬───┬───┬──┘
                                │   │   │
                ┌───────────────┘   │   └────────────────┐
                ▼                   ▼                    ▼
         ┌────────────┐      ┌────────────┐      ┌─────────────┐
         │  Postgres  │      │   Redis    │      │   S3 / R2   │
         │  (state)   │      │  (queue)   │      │  (assets)   │
         └────────────┘      └─────┬──────┘      └─────────────┘
                                   │
                                   │ workers consume
                                   ▼
                         ┌────────────────────┐
                         │  Compose Worker    │──────▶ Anthropic API
                         │  (Layer 2)         │
                         └─────────┬──────────┘
                                   │
                                   │ enqueue L3
                                   ▼
                         ┌────────────────────┐
                         │  Render Worker     │──────▶ OpenAI API
                         │  (Layer 3)         │
                         └────────────────────┘
```

## Local dev setup

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: dev
      POSTGRES_DB: tradieforce
    ports: ["5432:5432"]
    volumes: [pgdata:/var/lib/postgresql/data]

  redis:
    image: redis:7
    ports: ["6379:6379"]

  minio:  # S3-compatible local storage
    image: minio/minio
    command: server /data --console-address ":9001"
    ports: ["9000:9000", "9001:9001"]
    environment:
      MINIO_ROOT_USER: dev
      MINIO_ROOT_PASSWORD: devpassword

volumes:
  pgdata:
```

## Deployment

For early production:
- **Backend + workers:** Railway, Fly.io, or Render — single-region is fine, latency to AI APIs dominates
- **DB:** Supabase (managed)
- **Asset storage:** Cloudflare R2 (cheapest egress)
- **Frontend:** Vercel (Next.js) or same as backend

Cost: ~$50-100/month infrastructure to start. Scales linearly with pack volume.

## Environment variables

```bash
# Anthropic
ANTHROPIC_API_KEY=...

# OpenAI
OPENAI_API_KEY=...

# Postgres
DATABASE_URL=postgresql://...

# Redis
REDIS_URL=redis://...

# S3 / R2
S3_BUCKET=tradie-force-assets
S3_REGION=auto       # for R2
S3_ENDPOINT=https://....r2.cloudflarestorage.com
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...

# Sentry
SENTRY_DSN=...

# App
NODE_ENV=production
PORT=3000
SPEC_PATH=/app/spec/tradie_force_spec.json
LAYER_2_PROMPT_PATH=/app/prompts/layer2_system_prompt.md
```
