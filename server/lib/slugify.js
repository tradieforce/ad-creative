// Slug for filesystem-safe IDs: lowercase, hyphens, alnum only.
export function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

// Component key: same charset but underscores allowed (matches existing keys
// like cond_daikin, house_3d_blue).
export function normaliseComponentKey(s) {
  return String(s || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);
}

// Category slug for component folders: condensers, brand-logos, etc.
const CATEGORY_SLUGS = {
  Condenser: 'condensers',
  Outlet: 'outlets',
  Controller: 'controllers',
  Ducting: 'ducting',
  'House diagram': 'house-diagrams',
  'Stock family': 'stock-family',
  'Stock reaction': 'stock-reaction',
  'Stock bill/finance': 'bill-finance',
  'Holiday backdrop': 'holiday-backdrops',
  'Outdoor backdrop': 'outdoor-backdrops',
  'Brand logo': 'brand-logos',
  'Trust badge': 'trust-badges',
};
export function categorySlug(category) {
  return CATEGORY_SLUGS[category] || slugify(category);
}
