import { Router } from 'express';
import { db } from '../lib/db.js';
import { storage } from '../lib/storage.js';
import { loadComponents } from '../lib/components.js';
import { ComponentCreateSchema, ComponentPatchSchema, validate } from '../lib/schemas.js';
import { upload, extForMime } from '../lib/uploads.js';
import { categorySlug, normaliseComponentKey } from '../lib/slugify.js';

export const componentsRouter = Router();

componentsRouter.get('/', async (_req, res, next) => {
  try { res.json(await loadComponents()); } catch (e) { next(e); }
});

componentsRouter.post('/', upload.single('image'), async (req, res, next) => {
  try {
    const body = {
      category: req.body.category,
      key: normaliseComponentKey(req.body.key),
      description: req.body.description ?? '',
      type: req.body.type ?? 'image',
      usedBy: req.body.usedBy ? JSON.parse(req.body.usedBy) : [],
    };
    const data = validate(ComponentCreateSchema, body);

    let imagePath = null;
    if (req.file) {
      const ext = extForMime(req.file.mimetype);
      const cat = categorySlug(data.category);
      const key = `components/${cat}/${data.key}.${ext}`;
      const ct = req.file.mimetype || 'image/png';
      const { url } = await storage.put(key, req.file.buffer, ct);
      imagePath = url;
    }

    let created;
    await db.patchDoc('components', (list) => {
      const arr = Array.isArray(list) ? list : [];
      if (arr.some((c) => c.key === data.key)) {
        const e = new Error('component key already exists'); e.status = 409; throw e;
      }
      created = {
        category: data.category,
        key: data.key,
        type: data.type,
        description: data.description,
        imageId: data.key,
        usedBy: data.usedBy,
        imagePath,
      };
      arr.push(created);
      return arr;
    });
    res.status(201).json(created);
  } catch (e) { next(e); }
});

componentsRouter.patch('/:key', upload.single('image'), async (req, res, next) => {
  try {
    const incoming = {
      category: req.body.category,
      key: req.body.key ? normaliseComponentKey(req.body.key) : undefined,
      description: req.body.description,
      type: req.body.type,
      usedBy: req.body.usedBy
        ? (typeof req.body.usedBy === 'string' ? JSON.parse(req.body.usedBy) : req.body.usedBy)
        : undefined,
    };
    const cleaned = Object.fromEntries(Object.entries(incoming).filter(([, v]) => v !== undefined));
    const patch = validate(ComponentPatchSchema, cleaned);

    let updated;
    await db.patchDoc('components', async (list) => {
      const arr = Array.isArray(list) ? list : [];
      const i = arr.findIndex((c) => c.key === req.params.key);
      if (i === -1) { const e = new Error('component not found'); e.status = 404; throw e; }
      const old = arr[i];
      const newKey = patch.key ?? old.key;
      const newCategory = patch.category ?? old.category;

      let imagePath = old.imagePath;
      if (req.file) {
        const ext = extForMime(req.file.mimetype);
        const cat = categorySlug(newCategory);
        const key = `components/${cat}/${newKey}.${ext}`;
        const ct = req.file.mimetype || 'image/png';
        const { url } = await storage.put(key, req.file.buffer, ct);
        imagePath = url;
      }

      updated = { ...old, ...patch, imagePath, imageId: newKey };
      if (typeof updated.usedBy === 'string') {
        updated.usedBy = updated.usedBy.split(',').map((s) => s.trim()).filter(Boolean);
      }
      arr[i] = updated;
      return arr;
    });

    res.json(updated);
  } catch (e) { next(e); }
});

componentsRouter.delete('/:key', async (req, res, next) => {
  try {
    let removed = null;
    await db.patchDoc('components', (list) => {
      const arr = Array.isArray(list) ? list : [];
      const i = arr.findIndex((c) => c.key === req.params.key);
      if (i === -1) { const e = new Error('component not found'); e.status = 404; throw e; }
      removed = arr.splice(i, 1)[0];
      return arr;
    });
    if (removed?.imagePath && removed.imagePath.startsWith('/assets/')) {
      const key = removed.imagePath.slice('/assets/'.length);
      await storage.delete(key);
    }
    // For Blob-backed paths (full https URLs), we'd need to delete from Blob;
    // skipping that for safety — orphan blobs are cheap.
    res.json({ ok: true });
  } catch (e) { next(e); }
});
