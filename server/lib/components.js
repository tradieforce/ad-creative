import { readJSON } from './store.js';
import { FILES } from './paths.js';

// Normalise components on read. The original spec stores usedBy as a
// comma-separated string ("A7, A8, A9"); the UI expects an array. Force
// every entry to an array, split/trim/filter on the way through.
export async function loadComponents() {
  const arr = await readJSON(FILES.components, []);
  for (const c of arr) {
    if (typeof c.usedBy === 'string') {
      c.usedBy = c.usedBy.split(',').map((s) => s.trim()).filter(Boolean);
    } else if (!Array.isArray(c.usedBy)) {
      c.usedBy = [];
    }
  }
  return arr;
}
