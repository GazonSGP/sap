// Определение типа медиа по URL

const IMAGE_EXTS = ['jpg','jpeg','png','gif','webp','svg','bmp','tiff','ico'];
const VIDEO_EXTS = ['mp4','webm','ogg','mov','mkv'];

function extFromUrl(url) {
  if (!url) return '';
  const clean = url.split('?')[0].toLowerCase();
  const match = clean.match(/\.([a-z0-9]+)$/);
  return match ? match[1] : '';
}

export function isImage(url) {
  return IMAGE_EXTS.includes(extFromUrl(url));
}

export function isVideo(url) {
  return VIDEO_EXTS.includes(extFromUrl(url));
}

export function fileNameFromUrl(url) {
  if (!url) return '';
  try {
    return decodeURIComponent(url.split('/').pop().split('?')[0]);
  } catch {
    return url.split('/').pop();
  }
}
