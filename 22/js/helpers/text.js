// Текстовые утилиты (XSS-safe)

export function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function cropText(text, maxLength = 180) {
  if (!text) return '';
  return text.length <= maxLength
    ? text
    : text.slice(0, maxLength) + '...';
}
