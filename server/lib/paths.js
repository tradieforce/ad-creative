import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const DATA_DIR = join(ROOT, 'data');
export const ASSETS_DIR = join(ROOT, 'assets');
export const UI_DIR = join(ROOT, 'ui');
export const DOCS_DIR = join(ROOT, 'docs');

export const FILES = {
  archetypes: join(DATA_DIR, 'archetypes.json'),
  globalRules: join(DATA_DIR, 'global-rules.json'),
  components: join(DATA_DIR, 'components.json'),
  prices: join(DATA_DIR, 'prices.json'),
  ads: join(DATA_DIR, 'ads.json'),
  masterPrompt: join(DATA_DIR, 'master-prompt.md'),
  clientsDir: join(DATA_DIR, 'clients'),
};
