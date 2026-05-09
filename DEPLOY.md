# Deploy to Vercel — runbook

The app is wired for two modes. **Local dev** uses filesystem + JSON files (current behaviour, nothing to do). **Vercel prod** uses Vercel Postgres + Vercel Blob — turned on automatically when the env vars are set.

The local mode keeps working forever. You can keep developing on your Mac, push to GitHub, and Vercel auto-deploys.

---

## 1. One-time GitHub push (you, in your terminal)

```bash
cd "/Users/braychapman/Desktop/Ad Creative Tool/tradie-force-admin"
git push -u origin main
```

(GitHub will open browser for auth; macOS keychain caches the credential after that. Future commits I push for you.)

---

## 2. Vercel project setup (you, in Vercel dashboard)

1. Go to <https://vercel.com/new>
2. **Import Git Repository** → select `tradieforce/ad-creative`
3. **Framework Preset**: leave as **Other** (Vercel detects vercel.json)
4. **Root Directory**: leave as `./`
5. **Build Command**: leave default (vercel.json overrides)
6. Click **Deploy** — it'll fail the first deploy because env vars aren't set yet. That's expected.

---

## 3. Provision Vercel Postgres + Blob (one-click each)

In your Vercel project dashboard:

### Postgres
- Storage tab → **Create Database** → **Postgres** → give it any name (e.g. `tradieforce-db`)
- It auto-injects `POSTGRES_URL` and `DATABASE_URL` env vars into your project

### Blob
- Storage tab → **Create Database** → **Blob** → name (e.g. `tradieforce-assets`)
- Auto-injects `BLOB_READ_WRITE_TOKEN`

---

## 4. Set the rest of the env vars (you, Vercel dashboard → Settings → Environment Variables)

| Name | Value | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | sk-ant-… | from your existing .env |
| `OPENAI_API_KEY` | sk-proj-… | from your existing .env |
| `OPENAI_IMAGE_MODEL` | `gpt-image-2` | |
| `ANTHROPIC_MODEL` | `claude-opus-4-7` | |
| `ADMIN_PASSWORD` | (pick something) | login password — single-user gate |
| `SESSION_SECRET` | (random ~32-char string) | optional but recommended; defaults to ADMIN_PASSWORD-derived |
| `REPLICATE_API_TOKEN` | (optional) | unlocks Real-ESRGAN 4x upscale; sharp Lanczos3 fallback otherwise |

Set them for **Production** + **Preview** + **Development** environments.

---

## 5. Re-deploy

After env vars are set:
- Vercel dashboard → **Deployments** → tap the latest failed deploy → **Redeploy**
- Or just push any commit — auto-deploys

The deploy will succeed but the **Postgres database is empty**. Next step migrates your local data into it.

---

## 6. Migrate your local data → Postgres + Blob (you, one-time)

This pushes your archetypes, components, master prompt, prices, etc. into Postgres, and uploads every image asset into Blob. **Re-runnable** — existing rows are upserted, blobs overwritten.

```bash
cd "/Users/braychapman/Desktop/Ad Creative Tool/tradie-force-admin"

# Get the connection string from Vercel: Storage → Postgres → .env.local tab.
# It'll be something like:
#   POSTGRES_URL=postgres://...neon.tech/neondb?sslmode=require
#   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...

# Easiest: vercel env pull
npx vercel link            # links this folder to your Vercel project
npx vercel env pull .env.production.local

# Then run the migration with prod env in scope:
node --env-file=.env.production.local scripts/migrate-from-json.js
```

Expected output:
```
[migrate] applying schema…
[migrate] document "archetypes": imported (10 items)
[migrate] document "global-rules": imported (19 items)
[migrate] document "components": imported (255 items)
[migrate] document "prices": imported (19 items)
[migrate] document "ads": imported (... items)
[migrate] document "master-prompt": imported (24108 chars)
[migrate] client "sharp_aircon": imported
[migrate] uploading assets to Vercel Blob…
[migrate]  uploaded 10…
[migrate]  uploaded 20…
…
[migrate] uploaded ~330 assets; component imagePaths rewritten to Blob URLs
[migrate] done.
```

After this, **prod is fully populated** and ready to use.

---

## 7. Domain (you, DNS at your registrar)

In Vercel dashboard → **Settings** → **Domains** → add `tradieforce.com`.

Vercel will tell you which DNS records to add. For a typical setup:

| Type | Host | Value |
|---|---|---|
| `A` | `@` | `76.76.21.21` (Vercel's apex IP) |
| `CNAME` | `www` | `cname.vercel-dns.com` |

Or, even simpler, change your domain's nameservers to Vercel's (`ns1.vercel-dns.com`, `ns2.vercel-dns.com`) — they take over DNS entirely.

SSL cert auto-provisions in ~60 seconds.

---

## 8. Smoke test prod

1. Open `https://tradieforce.com`
2. Login page appears → enter `ADMIN_PASSWORD`
3. Sidebar loads → Archetypes / Components / Clients all populated
4. Generate Ad → pick A1 + Sharp Air Conditioning → Compose & render
5. Wait 4-6 min → image renders, saved to Blob, listed in Ad Database

---

## What runs where — quick mental model

```
                                   USER
                                    │
                                    ▼
                           https://tradieforce.com
                                    │
              ┌─────────────────────┴─────────────────────┐
              │                                            │
       Vercel CDN (static)                         Vercel Function (Express)
       /index.html                                 /api/* → server.js
       /app.js                                      memory: 3 GB
       /styles.css                                  maxDuration: 800s (Fluid Compute)
       /login.html                                            │
                                       ┌────────────────────┼────────────────────┐
                                       │                    │                    │
                                  Vercel Postgres     Vercel Blob         Anthropic + OpenAI
                                  (archetypes,        (component images,  (Claude Opus,
                                   clients, ads,       reference ads,      gpt-image-2)
                                   spend log,          generated PNGs,
                                   master-prompt,      client photos)
                                   global-rules,
                                   prices)
```

---

## Cost estimate

- **Vercel Pro**: $20/mo (required for Fluid Compute / 800s functions)
- **Vercel Postgres** (Hobby tier): free up to 256MB. Upgrade to $20/mo when you cross it (likely 1+ year out)
- **Vercel Blob**: $0.15/GB stored + $0.30/GB egress. Likely <$3/mo for ~250 component images + your generated ads.
- **Anthropic + OpenAI**: pay-as-you-go, ~$2/ad with full premium pipeline

Total infra: ~**$23/mo** to start, no per-ad infra cost beyond the AI APIs.

---

## What I will do for you next session

After you confirm the GitHub push worked + Vercel project is created + env vars are set:

1. Run `vercel link` and `vercel env pull` from your machine (you do this — gives me the `.env.production.local`)
2. I run the `migrate-from-json.js` script from your terminal (one command, you can run it; or I can step you through)
3. We smoke-test the prod URL
4. Iterate on anything broken

Reversible at every step. Local dev never breaks.
