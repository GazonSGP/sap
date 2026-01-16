export function openImageLightbox(src) {
  const lb = document.getElementById('imageLightbox');
  const img = document.getElementById('lightboxImg');
  if (!lb || !img) return;
  img.src = src;
  lb.style.display = 'flex';
}

export function closeImageLightbox() {
  const lb = document.getElementById('imageLightbox');
  const img = document.getElementById('lightboxImg');
  if (!lb || !img) return;
  img.src = '';
  lb.style.display = 'none';
}

document.getElementById('imageLightbox')?.addEventListener('click', e => {
  if (e.target.id === 'imageLightbox') closeImageLightbox();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeImageLightbox();
});
