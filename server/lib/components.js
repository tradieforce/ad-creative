import { db } from './db.js';

// Normalise components on read. The original spec stores usedBy as a
// comma-separated string ("A7, A8, A9"); the UI expects an array.
export async function loadComponents() {
  const arr = (await db.readDoc('components')) || [];
  for (const c of arr) {
    if (typeof c.usedBy === 'string') {
      c.usedBy = c.usedBy.split(',').map((s) => s.trim()).filter(Boolean);
    } else if (!Array.isArray(c.usedBy)) {
      c.usedBy = [];
    }
  }
  return arr;
}
