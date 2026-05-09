import multer from 'multer';

// Buffer uploads in memory; routes decide where to write them on disk so we
// can name files consistently (component key, archetype slug, etc.) instead
// of letting multer pick.
const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB per image is plenty
});

const EXT_BY_MIME = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export function extForMime(mime) {
  return EXT_BY_MIME[mime] || 'png';
}
