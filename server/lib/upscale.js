// Ultra-HD upscale pipeline.
//
// Two paths:
//   1. REPLICATE_API_TOKEN set    → Real-ESRGAN ML upscale (true 2x/4x detail recovery)
//   2. Otherwise                  → sharp Lanczos3 + adaptive sharpening fallback
//
// Both paths produce three sizes per generation:
//   - {ad_id}.png       → 1080×1080 (canonical, HR10 compliant)
//   - {ad_id}_2k.png    → 2160×2160 (HD)
//   - {ad_id}_4k.png    → 4320×4320 (only when Real-ESRGAN active)
//
// We always run sharp Lanczos3 even after Real-ESRGAN, to standardise sizes
// and apply a final sharpening pass.

import sharp from 'sharp';

const REPLICATE_VERSION_REAL_ESRGAN =
  // Real-ESRGAN x4 — Nightmareai's well-maintained Replicate model.
  // ID can drift; pin to a known-good version.
  '350d32041630ffbe63c8352783a26d94126809164e54085352f8326e53999085';

async function replicateUpscale(buf, scale = 4) {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) return null;

  // CRITICAL: every fetch must be try/catched. Network failures (DNS, timeout,
  // connection refused) throw rather than return a non-ok response. Without
  // catching, the error propagates up through upscalePipeline → generate.js
  // and aborts the whole generation.
  try {
    const b64 = buf.toString('base64');
    const dataUri = 'data:image/png;base64,' + b64;

    const create = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        Authorization: `Token ${token}`,
        'content-type': 'application/json',
        Prefer: 'wait',
      },
      body: JSON.stringify({
        version: REPLICATE_VERSION_REAL_ESRGAN,
        input: { image: dataUri, scale, face_enhance: false },
      }),
      // Cap individual fetch at 90s so we don't hang indefinitely.
      signal: AbortSignal.timeout(90_000),
    });
    if (!create.ok) {
      const t = await create.text().catch(() => '');
      console.warn('[upscale] Replicate create failed:', create.status, t.slice(0, 200));
      return null;
    }
    let pred = await create.json();

    let tries = 0;
    while (pred.status !== 'succeeded' && pred.status !== 'failed' && pred.status !== 'canceled' && tries < 60) {
      await new Promise((r) => setTimeout(r, 2000));
      try {
        const get = await fetch(pred.urls.get, {
          headers: { Authorization: `Token ${token}` },
          signal: AbortSignal.timeout(15_000),
        });
        if (!get.ok) break;
        pred = await get.json();
      } catch (e) { console.warn('[upscale] poll fetch failed:', e.message); break; }
      tries++;
    }
    if (pred.status !== 'succeeded') {
      console.warn('[upscale] Replicate did not succeed:', pred.status, pred.error || '');
      return null;
    }

    const outUrl = Array.isArray(pred.output) ? pred.output[0] : pred.output;
    if (!outUrl) return null;
    const dl = await fetch(outUrl, { signal: AbortSignal.timeout(60_000) });
    if (!dl.ok) return null;
    return Buffer.from(await dl.arrayBuffer());
  } catch (e) {
    console.warn('[upscale] Replicate threw — falling back to sharp:', e.message);
    return null;
  }
}

async function sharpUpscale(buf, targetW, targetH) {
  // Two-step pipeline:
  //   1. Lanczos3 upscale to target size
  //   2. Light unsharp mask to recover edge crispness lost in interpolation
  //   3. Re-encode as PNG with high compression
  return await sharp(buf)
    .resize(targetW, targetH, {
      kernel: sharp.kernel.lanczos3,
      fit: 'cover',
      position: 'center',
    })
    .sharpen({ sigma: 0.8, m1: 0.6, m2: 1.2 })  // gentle, photo-friendly
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();
}

// Used by generate.js after picking the canonical candidate.
// Returns { png1080, png2160, png4320 (optional), method }.
export async function upscalePipeline({ inputBuffer, archetype }) {
  const isPortrait = false;  // currently always square (HR10) — wire archetype-driven if A9 portrait variant added
  const w1080 = 1080, h1080 = 1080;
  const w2160 = 2160, h2160 = 2160;
  const w4320 = 4320, h4320 = 4320;

  let mlUpscaled = null;
  let method = 'sharp_lanczos3_sharpened';
  if (process.env.REPLICATE_API_TOKEN) {
    mlUpscaled = await replicateUpscale(inputBuffer, 4);  // 1024 → 4096
    if (mlUpscaled) method = 'real_esrgan_4x_then_sharp';
  }

  // Standardise sizes via sharp regardless of source. ML output may be 4096,
  // we resample down to exact 4320 (slight upscale) and 2160 (downscale).
  const source = mlUpscaled || inputBuffer;

  const png1080 = await sharpUpscale(source, w1080, h1080);
  const png2160 = await sharpUpscale(source, w2160, h2160);
  let png4320 = null;
  if (mlUpscaled) {
    png4320 = await sharpUpscale(source, w4320, h4320);
  }

  return { png1080, png2160, png4320, method };
}

// Back-compat helper used elsewhere — single-target upscale.
export async function upscaleTo({ inputBuffer, width = 1080, height = 1080 }) {
  return await sharpUpscale(inputBuffer, width, height);
}
