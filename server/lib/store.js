import { promises as fs } from 'node:fs';
import { dirname } from 'node:path';

// Per-file write queue so concurrent PATCHes don't clobber each other.
const queues = new Map();

async function withLock(path, fn) {
  const prev = queues.get(path) || Promise.resolve();
  let release;
  const next = prev.then(() => new Promise((r) => { release = r; }));
  queues.set(path, next);
  try {
    await prev;
    return await fn();
  } finally {
    release();
    if (queues.get(path) === next) queues.delete(path);
  }
}

export async function readJSON(path, fallback) {
  try {
    const raw = await fs.readFile(path, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    if (e.code === 'ENOENT' && fallback !== undefined) return fallback;
    throw e;
  }
}

export async function writeJSON(path, value) {
  return withLock(path, async () => {
    await fs.mkdir(dirname(path), { recursive: true });
    const tmp = path + '.tmp';
    await fs.writeFile(tmp, JSON.stringify(value, null, 2) + '\n', 'utf8');
    await fs.rename(tmp, path);
  });
}

export async function readText(path, fallback) {
  try {
    return await fs.readFile(path, 'utf8');
  } catch (e) {
    if (e.code === 'ENOENT' && fallback !== undefined) return fallback;
    throw e;
  }
}

export async function writeText(path, value) {
  return withLock(path, async () => {
    await fs.mkdir(dirname(path), { recursive: true });
    const tmp = path + '.tmp';
    await fs.writeFile(tmp, value, 'utf8');
    await fs.rename(tmp, path);
  });
}

// Mutate a JSON file under lock. `mutator` receives the parsed value, can
// either return a new value or mutate in place; we always write back.
export async function patchJSON(path, mutator, fallback) {
  return withLock(path, async () => {
    let current;
    try {
      current = JSON.parse(await fs.readFile(path, 'utf8'));
    } catch (e) {
      if (e.code === 'ENOENT' && fallback !== undefined) current = fallback;
      else throw e;
    }
    const next = await mutator(current);
    const out = next === undefined ? current : next;
    await fs.mkdir(dirname(path), { recursive: true });
    const tmp = path + '.tmp';
    await fs.writeFile(tmp, JSON.stringify(out, null, 2) + '\n', 'utf8');
    await fs.rename(tmp, path);
    return out;
  });
}
