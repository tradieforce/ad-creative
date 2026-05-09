// Storage abstraction — local filesystem in dev, Vercel Blob in prod.
//
// Toggle via STORAGE env:
//   STORAGE=fs      (default if BLOB_READ_WRITE_TOKEN unset) → local disk
//   STORAGE=blob    (auto when BLOB_READ_WRITE_TOKEN is set) → Vercel Blob
//
// Interface:
//   storage.put(key, buffer, contentType?) → { url, key }
//   storage.get(key)   → Buffer
//   storage.delete(key)
//   storage.list(prefix?) → string[]
//   storage.url(key)   → string  (URL the browser can fetch)
//
// `key` is a slash-separated path that mirrors the legacy /assets/ structure:
//   "components/condensers/cond_daikin.png"
//   "reference-ads/A1-energy-bill-hero/reference.png"
//   "client-uploads/sharp_aircon/team-1.jpg"
//   "generated-ads/sharp_aircon/ad_xyz.png"

import { promises as fs } from 'node:fs';
import { join, dirname } from 'node:path';
import { ASSETS_DIR } from './paths.js';

const MODE = (process.env.STORAGE || (process.env.BLOB_READ_WRITE_TOKEN ? 'blob' : 'fs')).toLowerCase();

// ── FILESYSTEM BACKEND ────────────────────────────────────────────────────
const fsBackend = {
  mode: 'fs',
  async put(key, buffer, _contentType) {
    const path = join(ASSETS_DIR, key);
    await fs.mkdir(dirname(path), { recursive: true });
    await fs.writeFile(path, buffer);
    return { url: '/assets/' + key, key };
  },
  async get(key) {
    return await fs.readFile(join(ASSETS_DIR, key));
  },
  async delete(key) {
    await fs.unlink(join(ASSETS_DIR, key)).catch(() => {});
  },
  async list(prefix = '') {
    // Recursive walk under prefix.
    const start = join(ASSETS_DIR, prefix);
    const out = [];
    async function walk(dir, rel) {
      let entries;
      try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return; }
      for (const e of entries) {
        const full = join(dir, e.name);
        const r = rel ? `${rel}/${e.name}` : e.name;
        if (e.isDirectory()) await walk(full, r);
        else out.push(prefix ? `${prefix}/${r}` : r);
      }
    }
    await walk(start, '');
    return out;
  },
  url(key) { return '/assets/' + key; },
};

// ── VERCEL BLOB BACKEND ───────────────────────────────────────────────────
let _blobModule = null;
async function blobMod() {
  if (!_blobModule) _blobModule = await import('@vercel/blob');
  return _blobModule;
}

const blobBackend = {
  mode: 'blob',
  async put(key, buffer, contentType = 'application/octet-stream') {
    const { put } = await blobMod();
    // pathname-style key — Vercel Blob accepts slashes, builds CDN URL.
    const result = await put(key, buffer, {
      access: 'public',
      contentType,
      addRandomSuffix: false,    // we control keys; want stable URLs
      allowOverwrite: true,
    });
    return { url: result.url, key };
  },
  async get(key) {
    const { head } = await blobMod();
    const meta = await head(key).catch(() => null);
    if (!meta) throw new Error('blob not found: ' + key);
    const r = await fetch(meta.url);
    if (!r.ok) throw new Error('blob fetch failed: ' + r.status);
    return Buffer.from(await r.arrayBuffer());
  },
  async delete(key) {
    const { del } = await blobMod();
    await del(key).catch(() => {});
  },
  async list(prefix = '') {
    const { list } = await blobMod();
    const out = [];
    let cursor;
    do {
      const page = await list({ prefix, cursor });
      for (const b of page.blobs) out.push(b.pathname);
      cursor = page.cursor;
    } while (cursor);
    return out;
  },
  url(_key) {
    // Blob URLs aren't deterministic from the key alone — call put() to get URL.
    // For URLs already stored in DB rows (components.imagePath etc.), they're
    // already full https:// URLs and don't need to be re-derived.
    throw new Error('storage.url(key) not supported on blob backend; use put() return value or stored URL');
  },
};

// Active backend
export const storage = MODE === 'blob' ? blobBackend : fsBackend;
export const STORAGE_MODE = storage.mode;

// Translate a legacy /assets/foo/bar.png URL into a storage key.
export function urlToKey(urlOrKey) {
  if (!urlOrKey) return null;
  if (urlOrKey.startsWith('/assets/')) return urlOrKey.slice('/assets/'.length);
  if (urlOrKey.startsWith('https://')) return null;   // already a CDN URL — caller should use as-is
  return urlOrKey.replace(/^\/+/, '');
}

// In FS mode, returns "/assets/foo.png". In Blob mode, returns the stored URL
// (which the caller must have saved when they put() the file).
export function publicUrl(keyOrUrl) {
  if (!keyOrUrl) return '';
  if (keyOrUrl.startsWith('http')) return keyOrUrl;
  if (keyOrUrl.startsWith('/')) return keyOrUrl;
  if (storage.mode === 'fs') return '/assets/' + keyOrUrl;
  return keyOrUrl;   // Blob mode — caller is responsible for storing the full URL
}

// Resolve any "asset reference" (Blob URL, /assets/ path, absolute disk path,
// or storage key) into a Buffer. Used by composePrompt / renderImage / pickBest
// so they don't care where the asset lives.
export async function loadBuffer(ref) {
  if (!ref) throw new Error('loadBuffer: empty ref');
  // Full URL (Blob, gold-standard, anywhere) → fetch it.
  if (ref.startsWith('http://') || ref.startsWith('https://')) {
    const r = await fetch(ref);
    if (!r.ok) throw new Error(`loadBuffer fetch ${r.status}: ${ref}`);
    return Buffer.from(await r.arrayBuffer());
  }
  // /assets/ URL → translate to storage key.
  if (ref.startsWith('/assets/')) {
    const key = ref.slice('/assets/'.length);
    return await storage.get(key);
  }
  // Absolute filesystem path (legacy callers) — read directly.
  if (ref.startsWith('/')) {
    const { promises: fsp } = await import('node:fs');
    return await fsp.readFile(ref);
  }
  // Anything else: treat as storage key.
  return await storage.get(ref);
}

// Mime type from extension — used when re-uploading or sending to APIs.
export function mimeFromRef(ref) {
  const lower = (ref || '').toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  return 'application/octet-stream';
}
