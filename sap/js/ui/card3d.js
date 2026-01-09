// ui/card3d.js
const STORAGE_KEY = 'enable3d';

function clearInlineTransform(card) {
  card.style.removeProperty('transform');
}

function resetAllCards() {
  document
    .querySelectorAll('.instruction-card')
    .forEach(card => {
      clearInlineTransform(card);
      card.style.removeProperty('--lx');
      card.style.removeProperty('--ly');
    });
}

export function init3DCards() {
  const cards = document.querySelectorAll('.instruction-card');
  if (!cards.length) return;

  const enabled = localStorage.getItem(STORAGE_KEY) !== 'false';
  document.body.classList.toggle('no-3d', !enabled);

  cards.forEach(card => {
    card.classList.add('is-3d');
    let rect = null;

    card.addEventListener('mouseenter', () => {
      if (document.body.classList.contains('no-3d')) return;
      rect = card.getBoundingClientRect();
    });

    card.addEventListener('mousemove', e => {
      if (!rect || document.body.classList.contains('no-3d')) return;

      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;

      /* 🔥 координаты для glow */
      card.style.setProperty('--lx', `${(x + 1) * 50}%`);
      card.style.setProperty('--ly', `${(y + 1) * 50}%`);

      const rotateY = x * 14;
      const rotateX = -y * 14;

      card.style.transform = `
        rotateY(${rotateY}deg)
        rotateX(${rotateX}deg)
        translateZ(10px)
      `;
    });

    card.addEventListener('mouseleave', () => {
      rect = null;
      clearInlineTransform(card);
      card.style.removeProperty('--lx');
      card.style.removeProperty('--ly');
    });
  });
}

/* ================= TOGGLE ================= */

export function init3DToggle() {
  const toggle = document.getElementById('toggle3d');
  if (!toggle) return;

  const enabled = localStorage.getItem(STORAGE_KEY) !== 'false';
  toggle.checked = enabled;
  document.body.classList.toggle('no-3d', !enabled);

  toggle.addEventListener('change', () => {
    const isOn = toggle.checked;
    localStorage.setItem(STORAGE_KEY, isOn);
    document.body.classList.toggle('no-3d', !isOn);
    resetAllCards();
  });
}

/* ================= MODAL SAFETY ================= */

document.addEventListener('click', e => {
  if (
    e.target.closest('.open-instruction') ||
    e.target.closest('.instruction-card')
  ) {
    resetAllCards();
  }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    resetAllCards();
  }
});
