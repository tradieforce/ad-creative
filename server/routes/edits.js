// Save flattened ad images from the canvas editor + manual best-of-N picks.
//
//   POST /api/edits/:adId           multipart with `image` (PNG)
//                                   → saves as {ad_id}_edited.png + updates ad record
//
//   POST /api/edits/pick/:adId      JSON body: { candidate_url }
//                                   → promotes a saved candidate to canonical
//
//   POST /api/edits/upscale/:adId   re-runs HD upscale on canonical image

import { Router } from 'express';
import { db } from '../lib/db.js';
import { storage, loadBuffer } from '../lib/storage.js';
import { upload } from '../lib/uploads.js';
import { upscalePipeline } from '../lib/upscale.js';

export const editsRouter = Router();

async function findAd(adId) {
  const ads = await db.listAds();
  return ads.find((a) => a.id === adId) || null;
}

// Derive the storage key prefix for an ad (e.g. "generated-ads/sharp_aircon/ad_xyz")
// from any of its URL fields. Works for both /assets/ and Blob URLs.
function adKeyBase(ad) {
  const url = ad.image_url || (ad.candidate_urls && ad.candidate_urls[0]);
  if (!url) return null;
  // Strip query string + extension + edit suffix
  const noQ = url.split('?')[0];
  // For /assets/ URLs
  if (noQ.startsWith('/assets/')) {
    return noQ.slice('/assets/'.length).replace(/(_edited|_2k|_4k|_c\d+)?\.png$/, '');
  }
  // For Blob URLs — the pathname after the last slash before any /generated-ads/ segment
  const m = noQ.match(/generated-ads\/[^/]+\/(ad_[a-z0-9_]+)/i);
  if (m) {
    // Try to reconstruct the key from the URL pathname
    const idx = noQ.indexOf('/generated-ads/');
    if (idx !== -1) {
      const tail = noQ.slice(idx + 1).replace(/(_edited|_2k|_4k|_c\d+)?\.png$/, '');
      return tail;
    }
  }
  return null;
}

editsRouter.post('/:adId', upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'no image uploaded' });
    const ad = await findAd(req.params.adId);
    if (!ad) return res.status(404).json({ error: 'ad not found' });

    const base = adKeyBase(ad);
    if (!base) return res.status(500).json({ error: 'could not derive ad key from record' });

    const editedKey = base + '_edited.png';
    const { url } = await storage.put(editedKey, req.file.buffer, 'image/png');

    await db.patchAd(ad.id, (current) => ({
      ...current,
      edited_url: url,
      image_url: url,        // promote edited as canonical
      edited_at: new Date().toISOString(),
    }));

    res.json({ ok: true, url });
  } catch (e) { next(e); }
});

editsRouter.post('/pick/:adId', async (req, res, next) => {
  try {
    const ad = await findAd(req.params.adId);
    if (!ad) return res.status(404).json({ error: 'ad not found' });
    const candidateUrl = (req.body || {}).candidate_url;
    if (!candidateUrl) return res.status(400).json({ error: 'candidate_url required' });

    // Copy chosen candidate bytes onto the canonical key.
    const buf = await loadBuffer(candidateUrl);
    const base = adKeyBase(ad);
    if (!base) return res.status(500).json({ error: 'could not derive ad key' });
    const canonKey = base + '.png';
    const { url } = await storage.put(canonKey, buf, 'image/png');

    await db.patchAd(ad.id, (current) => ({
      ...current,
      image_url: url,
      picked_url: candidateUrl,
      picked_at: new Date().toISOString(),
    }));

    res.json({ ok: true, url });
  } catch (e) { next(e); }
});

editsRouter.post('/upscale/:adId', async (req, res, next) => {
  try {
    const ad = await findAd(req.params.adId);
    if (!ad) return res.status(404).json({ error: 'ad not found' });
    const buf = await loadBuffer(ad.image_url);
    const base = adKeyBase(ad);
    if (!base) return res.status(500).json({ error: 'could not derive ad key' });

    const { png2160, png4320, method } = await upscalePipeline({ inputBuffer: buf, archetype: ad.archetype });
    const out = { ok: true, method, urls: {} };

    const { url: u2k } = await storage.put(base + '_2k.png', png2160, 'image/png');
    out.urls['2k'] = u2k;

    if (png4320) {
      const { url: u4k } = await storage.put(base + '_4k.png', png4320, 'image/png');
      out.urls['4k'] = u4k;
    }

    await db.patchAd(ad.id, (current) => ({ ...current, hd_urls: out.urls, hd_method: method }));

    res.json(out);
  } catch (e) { next(e); }
});
