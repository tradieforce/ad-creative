# Claude session rules — Ad Creative Tool

These are behavioural rules for Claude Code when working in this project. They are not product rules — product rules (sale percentages, warranty lengths, copy restrictions, etc.) live in the software's data files (`data/master-prompt.md`, `data/archetypes.json`, `data/global-rules.json`, `data/prices.json`) and are enforced by the system, not by Claude.

---

## 1. Never open images ≥1800px on the long edge.

**Why:** Multiple prior sessions died with `An image in the conversation exceeds the dimension limit for many-image requests (2000px). Start a new session with fewer images.` — and rewinding doesn't escape it because the offending image stays in the rewound history. This is the single biggest reliability problem in this project.

**Process — every time, no exceptions:**

1. Before any `Read` on an image (`.png`, `.jpg`, `.jpeg`, `.webp`, `.heic`, etc.), check pixel dimensions first:
   ```bash
   sips -g pixelWidth -g pixelHeight "/path/to/image"
   ```
   or
   ```python
   from PIL import Image
   Image.open("/path/to/image").size
   ```
2. If width OR height ≥ 1800px, **do not Read the original**. Generate a downsized preview ≤1200px on the long edge and Read that instead:
   ```python
   from PIL import Image
   img = Image.open(src)
   img.thumbnail((1200, 1200))
   img.save("/tmp/preview.png")
   ```
3. For viewing many images at once, build a contact sheet (multiple thumbnails in one image, total ≤1500px on the long edge) and Read the contact sheet — never Read the originals in batch.
4. If unsure of dimensions, check first. Cheaper than a dead session.

This rule binds even when the user asks Claude to "just open it." If the user really wants the full-resolution view, they can preview it themselves; Claude works from the downsized version.

### 1b. Total batch size — warn the user BEFORE they hit the API limit.

**Why:** Even when individual images are under 1800px, sending too many at once in a single message can blow past the API payload limit (≈30 MB total) and hard-lock the chat. A locked chat can't be recovered by rewinding — the offending content is already in history. This kills the session.

**Process:**

1. Before suggesting the user send a batch, **tell them the safe batch size**: roughly 4–6 images per message at typical stock-photo dimensions (1000–1500px JPEGs at ~150–400 KB each). If they're sending higher-resolution or .png files, drop to 3–4 per message.
2. If the user says "I'm about to send a heap" or asks how many to send: respond first with **"Send no more than ~5 at a time"** before they paste anything.
3. After receiving any batch, **immediately check the saved file sizes** on disk:
   ```python
   import os
   total_mb = sum(os.path.getsize(f) for f in files) / 1024 / 1024
   ```
   If the total of attached images this message > 20 MB, warn the user that future batches must be smaller.
4. If a batch hard-fails (API error / chat lock), the user is stuck — proactively keep batches small to prevent it.
5. Never silently accept whatever the user sends — proactive size guidance is the rule, not a fallback.

### 1c. Session size monitoring — hand off BEFORE the API blows up.

**Why:** The "Request too large (max 32MB)" error is **cumulative**, not per-message. Every turn the API call includes the running session history. When the JSONL session file approaches ~50MB, almost any new image-heavy turn will tip it over. Rewinding doesn't help because the session size is already too large. Once this happens, the session is effectively dead.

**Process — every time, no exceptions:**

1. **Before doing any image-heavy operation** (large contact sheet read, multi-batch audit, viewing many images at once), **check the session JSONL size first**:
   ```bash
   ls -lh ~/.claude/projects/<project>/<session-id>.jsonl
   ```
2. **Size thresholds:**
   - **< 30 MB**: safe to proceed normally
   - **30–40 MB**: warn the user, prefer single small operations, defer big audits
   - **40–48 MB**: STOP. Tell the user the session is near the limit. Strongly recommend running `/handoff` and starting a fresh session BEFORE attempting any image-heavy work. A fresh session with the handoff JSON loaded retains all the project context but clears the API payload.
   - **> 48 MB**: refuse to read any new images this session. Only allow text-only work + handoff prep.
3. **What counts as image-heavy:** reading a contact sheet that's >500KB, batch-viewing >3 images individually, or any operation that adds >2MB of new context in a single turn.
4. **If the user pushes back** ("just do it"): explain the failure mode plainly. The session WILL die, the rewind WON'T fix it, and they'll lose the working state. Handoff first, work second.

**Default move when session is heavy: prep `/handoff` first, then do the work in a fresh chat.**

---

## 2. Don't integrate the real Claude API or ChatGPT Image 2 yet.

This phase is about making the local admin tool fully functional. The next phase (tech-guy phase, see `HANDOFF_FOR_TECH_GUY.md`) is where production APIs get connected. Don't add API keys, don't add real generation calls, don't replace the local server with a hosted backend. Make the local tool great; let the next person ship it.

If a feature seems to need a real API call, stub it locally with a clearly-marked placeholder and flag it in the handoff for the tech-guy phase.

---

## 3. The data files are the source of truth for product rules.

When working in this codebase, treat these as authoritative — do not invent product rules in Claude's head:

- `data/master-prompt.md` — the canonical Master AI prompt (single copy, editable in UI)
- `data/archetypes.json` — A1–A10 definitions, accents, the only conditional one is A10
- `data/global-rules.json` — global ad-copy and pricing rules
- `data/prices.json` — per-city pricing
- `data/components.json` — what's wired into UI component slots

If something contradicts: trust the data files over older docs, transcripts, or memory.

---

## 4. Visually verify every image before placing or naming it.

**Why:** Filenames lie (cryptic stock IDs, generic names like `image.webp`), thumbnails in contact sheets are too small to confirm details, and prior chat notes can be wrong. Mis-naming a component affects which archetype uses it, which can produce confusing or wrong ads.

**Process — every time:**

1. **Never classify from filename alone.** Files named `1.jpg`, `image.webp`, `1000_F_*.jpg`, hash-named — all opaque. Open them.
2. **Never classify from a contact-sheet thumbnail under 350px per tile.** Too small to see whether the dog in the corner is a dog or a cushion, whether the A/C unit on the wall is split or ducted, whether the subject is elderly or middle-aged.
3. **Build verification views at meaningful resolution.** When checking classifications, render at ≥500px per tile, ≤6 per row, total image ≤1500px on long edge (still under the 1800px rule from §1).
4. **For ambiguous images, view individually at 600–900px.** If a single image's classification matters (e.g. is this a holiday backdrop or just an outdoor scene?) — render it on its own at full preview size before deciding.
5. **Never trust prior-session classifications without re-checking.** Prior chats saw the image, but their notes may be wrong, the file may have been replaced, or the slot definition may have evolved. Re-verify when in doubt.
6. **When placing into a slot with a specific brief, re-read the slot description first.** A slot called `react_freezing_fam` is for a FAMILY (multiple people) bundled cold — not a couple, not a solo person. Match the visual to the slot definition exactly.
7. **If you're not sure, ask the user before placing.** Cheaper than fixing later.

**Specifically applies to:** triage sorts, batch placements, "did you check?" requests, anything where a filename or transcript suggests a classification but the image hasn't been opened in this session.

---

## 5. Disk state beats transcript every time.

When asked "is X done?" — look at the actual files on disk, not what a previous chat said. The transcript records intent; the files record reality. They drift. Trust the filesystem.

Examples of where to look:
- "Are all the brand condensers cropped?" → list `tradie-force-admin/assets/components/condensers/cond_*.png` and inspect them
- "Are the stock images sorted?" → walk `tradie-force-admin/assets/Stock Images/`
- "What's in the components UI?" → read `tradie-force-admin/data/components.json`
- "What's the current pricing?" → read `tradie-force-admin/data/prices.json`

---

## Where the project lives

The repo root for code is `tradie-force-admin/` (one level deep from where Claude Code is launched). The outer `Ad Creative Tool/` folder is just a wrapper around `.claude/` and `tradie-force-admin/`.

Key orient docs (read on session start if not already loaded):
- `tradie-force-admin/handoff-context.md` — the rolling JSON state (written by `/handoff`, read by `/resume`)
- `tradie-force-admin/00_START_HERE.md`
- `tradie-force-admin/PRODUCT_DIRECTION.md`

Slash commands available:
- `/handoff` — saves a complete cumulative session state as JSON to `tradie-force-admin/handoff-context.md`. Includes prior session history, not just this session.
- `/resume` — reads that JSON and orients

Anything in `tradie-force-admin/_archive/` is historical reference only — don't auto-read on session start. The handoff JSON is the source of truth for "what's been done."
