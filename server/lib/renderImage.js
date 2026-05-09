// Layer 3 — gpt-image-2 renders the final ad PNG.
//
// QUALITY-FIRST CONFIG:
//   - n=3 best-of-N by default (renders 3 candidates in parallel via separate
//     calls — OpenAI's n>1 on /edits is unreliable)
//   - quality="high" by default
//   - Returns all candidate buffers; caller picks best with vision
//
// Two paths:
//   - text-to-image: /v1/images/generations  (no input images)
//   - image edits:   /v1/images/edits        (with input reference + components)

import { promises as fs } from 'node:fs';
import { extname, basename, dirname } from 'node:path';
import { loadBuffer, mimeFromRef } from './storage.js';

const GEN_URL  = 'https://api.openai.com/v1/images/generations';
const EDIT_URL = 'https://api.openai.com/v1/images/edits';

// gpt-image-2 (released 2026-04-21) — token-based pricing; per-image
// approximation by quality tier for spend logging.
const PRICING_PER_IMAGE = {
  low:    0.011,
  medium: 0.042,
  high:   0.167,
  auto:   0.042,
};

const DEFAULT_SIZE = '1024x1024';
const SUPPORTED_INPUT_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp']);

function fileFromBuffer(buf, name, type) {
  if (typeof File !== 'undefined') return new File([buf], name, { type });
  const blob = new Blob([buf], { type });
  blob.name = name;
  return blob;
}

async function buildEditForm({ model, prompt, size, quality, attachments }) {
  const form = new FormData();
  form.set('model', model);
  form.set('prompt', prompt);
  form.set('size', size);
  form.set('quality', quality);
  form.set('n', '1');

  let added = 0;
  for (const att of attachments) {
    const ref = att.path;   // legacy field name; still works for URLs/keys
    const lower = ref.toLowerCase();
    if (!['.png','.jpg','.jpeg','.webp'].some(e => lower.endsWith(e))) {
      console.warn(`[renderImage] skipping unsupported input image: ${ref}`);
      continue;
    }
    const buf = await loadBuffer(ref);
    const mime = mimeFromRef(ref);
    const filename = basename(ref.split('?')[0]);
    form.append('image[]', fileFromBuffer(buf, filename, mime));
    added++;
    if (added >= 16) break;
  }
  return form;
}

async function callOnce({ model, prompt, size, quality, attachments, apiKey }) {
  let r;
  if (attachments && attachments.length > 0) {
    const form = await buildEditForm({ model, prompt, size, quality, attachments });
    r = await fetch(EDIT_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });
  } else {
    r = await fetch(GEN_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({ model, prompt, size, quality, n: 1 }),
    });
  }
  if (!r.ok) {
    const errBody = await r.text();
    throw new Error(`OpenAI image ${r.status}: ${errBody.slice(0, 800)}`);
  }
  const json = await r.json();
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) throw new Error('OpenAI returned no image data');
  return { buf: Buffer.from(b64, 'base64'), usage: json.usage || null };
}

// Render N candidates in parallel — returns an array of Buffers and a total cost.
export async function renderImageBestOfN({
  prompt,
  attachments = [],
  size = DEFAULT_SIZE,
  quality = 'high',
  n = 3,
}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not set');
  const model = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2';

  const calls = Array.from({ length: n }, () =>
    callOnce({ model, prompt, size, quality, attachments, apiKey })
  );

  // Promise.allSettled so one failure doesn't kill the whole batch.
  const settled = await Promise.allSettled(calls);
  const ok = settled.filter((s) => s.status === 'fulfilled').map((s) => s.value);
  const failed = settled.filter((s) => s.status === 'rejected');
  if (ok.length === 0) {
    throw new Error('All ' + n + ' image generations failed: ' + failed.map((f) => f.reason?.message).join(' | '));
  }
  for (const f of failed) console.warn('[renderImage] candidate failed:', f.reason?.message);

  return {
    candidates: ok.map((x) => x.buf),
    usages: ok.map((x) => x.usage),
    model,
    size,
    quality,
    costUsd: (PRICING_PER_IMAGE[quality] || PRICING_PER_IMAGE.auto) * ok.length,
    requested: n,
    succeeded: ok.length,
  };
}

// Single-shot helper retained for back-compat / quick tests.
export async function renderImage({ prompt, attachments = [], size = DEFAULT_SIZE, quality = 'high', outputPath }) {
  const result = await renderImageBestOfN({ prompt, attachments, size, quality, n: 1 });
  const buf = result.candidates[0];
  if (outputPath) {
    await fs.mkdir(dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, buf);
  }
  return {
    pngPath: outputPath || null,
    bytes: buf.length,
    model: result.model,
    size: result.size,
    quality: result.quality,
    costUsd: result.costUsd,
    usage: result.usages[0],
  };
}
