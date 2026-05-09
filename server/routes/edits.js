// Save flattened ad images from the canvas editor + manual best-of-N picks.
//
//   POST /api/edits/:adId           multipart with `image` (PNG)
//                                   → saves as {ad_id}_edited.png + sidecar JSON
//
//   POST /api/edits/pick/:adId      JSON body: { candidate_index: 0|1|2 }
//                                   → swaps the canonical PNG with the chosen alt

import { Router } from 'express';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { ASSETS_DIR, FILES, ROOT } from '../lib/paths.js';
import { upload } from '../lib/uploads.js';
import { readJSON, patchJSON } from '../lib/store.js';
import { upscalePipeline } from '../lib/upscale.js';

export const editsRouter = Router();

// Looks up the ad record; needed to find the file path under generated-ads/{client}/{ad_id}.png.
async function findAd(adId) {
  const ads = await readJSON(FILES.ads, []);
  return ads.find((a) => a.id === adId) || null;
}

// Save a flattened-canvas PNG as the user's edited variant.
editsRouter.post('/:adId', upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'no image uploaded' });
    const ad = await findAd(req.params.adId);
    if (!ad) return res.status(404).json({ error: 'ad not found' });

    // The canonical .png lives under /assets/generated-ads/{client}/{ad_id}.png.
    // We save the edited version with _edited suffix.
    const canonRelPath = ad.image_url; // /assets/generated-ads/{client}/{ad_id}.png
    const editedRelPath = canonRelPath.replace(/\.png$/, '_edited.png');
    const editedDisk = join(ROOT, editedRelPath.slice(1));
    await fs.writeFile(editedDisk, req.file.buffer);

    // Update the ad record to point at the edited version. Keep canonical
    // as a sibling so it's recoverable.
    await patchJSON(FILES.ads, (list) => {
      const i = (list || []).findIndex((a) => a.id === req.params.adId);
      if (i >= 0) {
        list[i].edited_url = editedRelPath;
        list[i].image_url = editedRelPath;  // promote edited to canonical
        list[i].edited_at = new Date().toISOString();
      }
      return list;
    }, []);

    res.json({ ok: true, url: editedRelPath });
  } catch (e) { next(e); }
});

// Manual best-of-N pick: swap canonical with one of the saved alts.
// We assume alts are stored as {ad_id}_alt{n}.png (n = original render index, NOT 0/1/2 per UI).
// The UI sends a {candidate_url} pointing at the desired alt — we move it to canonical.
editsRouter.post('/pick/:adId', async (req, res, next) => {
  try {
    const ad = await findAd(req.params.adId);
    if (!ad) return res.status(404).json({ error: 'ad not found' });
    const candidateUrl = (req.body || {}).candidate_url;
    if (!candidateUrl) return res.status(400).json({ error: 'candidate_url required' });
    if (!candidateUrl.startsWith('/assets/generated-ads/')) {
      return res.status(400).json({ error: 'candidate_url must be under /assets/generated-ads/' });
    }

    const candDisk = join(ROOT, candidateUrl.slice(1));
    const canonRel = ad.image_url.replace(/_edited\.png$/, '.png'); // current or original canonical
    const canonDisk = join(ROOT, canonRel.slice(1));

    // If the canonical is the AI-generated version (no _edited), we need to:
    // (1) move current canonical → an _alt slot
    // (2) move chosen candidate → canonical
    // For simplicity we just COPY rather than swap — disk space is cheap, and
    // we keep all candidates around for re-picking later.
    const buf = await fs.readFile(candDisk);
    await fs.writeFile(canonDisk, buf);

    // Update record
    await patchJSON(FILES.ads, (list) => {
      const i = (list || []).findIndex((a) => a.id === req.params.adId);
      if (i >= 0) {
        list[i].image_url = canonRel;
        list[i].picked_url = candidateUrl;
        list[i].picked_at = new Date().toISOString();
      }
      return list;
    }, []);

    res.json({ ok: true, url: canonRel });
  } catch (e) { next(e); }
});

// Trigger an HD upscale on demand for an existing ad. Generates _2k.png and
// (when Replicate is available) _4k.png alongside the canonical.
editsRouter.post('/upscale/:adId', async (req, res, next) => {
  try {
    const ad = await findAd(req.params.adId);
    if (!ad) return res.status(404).json({ error: 'ad not found' });
    const canonDisk = join(ROOT, ad.image_url.slice(1));
    const buf = await fs.readFile(canonDisk);
    const { png2160, png4320, method } = await upscalePipeline({ inputBuffer: buf, archetype: ad.archetype });
    const base = canonDisk.replace(/\.png$/, '');
    await fs.writeFile(base + '_2k.png', png2160);
    const out = { ok: true, method, urls: { '2k': ad.image_url.replace(/\.png$/, '_2k.png') } };
    if (png4320) {
      await fs.writeFile(base + '_4k.png', png4320);
      out.urls['4k'] = ad.image_url.replace(/\.png$/, '_4k.png');
    }
    res.json(out);
  } catch (e) { next(e); }
});
