import { Router } from 'express';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { FILES, ASSETS_DIR } from '../lib/paths.js';
import { patchJSON } from '../lib/store.js';
import { loadComponents } from '../lib/components.js';
import { ComponentCreateSchema, ComponentPatchSchema, validate } from '../lib/schemas.js';
import { upload, extForMime } from '../lib/uploads.js';
import { categorySlug, normaliseComponentKey } from '../lib/slugify.js';

export const componentsRouter = Router();

componentsRouter.get('/', async (_req, res, next) => {
  try { res.json(await loadComponents()); } catch (e) { next(e); }
});

// Multipart: image (optional file) + form fields category, key, description, type, usedBy (JSON).
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
      const dir = join(ASSETS_DIR, 'components', cat);
      await fs.mkdir(dir, { recursive: true });
      const filename = `${data.key}.${ext}`;
      await fs.writeFile(join(dir, filename), req.file.buffer);
      imagePath = `/assets/components/${cat}/${filename}`;
    }

    let created;
    await patchJSON(FILES.components, (list) => {
      if (list.some((c) => c.key === data.key)) {
        const e = new Error('component key already exists');
        e.status = 409;
        throw e;
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
      list.push(created);
      return list;
    });
    res.status(201).json(created);
  } catch (e) { next(e); }
});

// Multipart-or-JSON PATCH: if multipart with an image, replace the image too.
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
    // Strip undefined so .strict() in the schema doesn't complain about explicit undefineds.
    const cleaned = Object.fromEntries(Object.entries(incoming).filter(([, v]) => v !== undefined));
    const patch = validate(ComponentPatchSchema, cleaned);

    let updated;
    await patchJSON(FILES.components, async (list) => {
      const i = list.findIndex((c) => c.key === req.params.key);
      if (i === -1) {
        const e = new Error('component not found');
        e.status = 404;
        throw e;
      }
      const old = list[i];
      const newKey = patch.key ?? old.key;
      const newCategory = patch.category ?? old.category;

      // If the file changed, write it. If key/category changed, also rewrite path.
      let imagePath = old.imagePath;
      if (req.file) {
        const ext = extForMime(req.file.mimetype);
        const cat = categorySlug(newCategory);
        const dir = join(ASSETS_DIR, 'components', cat);
        await fs.mkdir(dir, { recursive: true });
        const filename = `${newKey}.${ext}`;
        await fs.writeFile(join(dir, filename), req.file.buffer);
        imagePath = `/assets/components/${cat}/${filename}`;
      }

      updated = {
        ...old,
        ...patch,
        imagePath,
        imageId: newKey,
      };
      // Normalise usedBy on read elsewhere; ensure array here too.
      if (typeof updated.usedBy === 'string') {
        updated.usedBy = updated.usedBy.split(',').map((s) => s.trim()).filter(Boolean);
      }
      list[i] = updated;
      return list;
    });

    res.json(updated);
  } catch (e) { next(e); }
});

componentsRouter.delete('/:key', async (req, res, next) => {
  try {
    let removed = null;
    await patchJSON(FILES.components, (list) => {
      const i = list.findIndex((c) => c.key === req.params.key);
      if (i === -1) {
        const e = new Error('component not found');
        e.status = 404;
        throw e;
      }
      removed = list.splice(i, 1)[0];
      return list;
    });

    // Best-effort delete the image file too.
    if (removed?.imagePath) {
      const onDisk = join(ASSETS_DIR, removed.imagePath.replace(/^\/assets\//, ''));
      await fs.unlink(onDisk).catch(() => {});
    }
    res.json({ ok: true });
  } catch (e) { next(e); }
});
