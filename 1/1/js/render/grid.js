// render/grid.js
import { state } from '../state/cache.js';
import { escapeHtml, cropText } from '../helpers/text.js';

/* ================= COLOR ================= */
function getColorForModule(code) {
  const palette = [
    '#0a6ed1', '#0b9f6b', '#f97316', '#7c3aed', '#ef4444',
    '#06b6d4', '#f59e0b', '#10b981', '#6366f1', '#db2777'
  ];
  if (!code) return palette[0];
  let h = 0;
  for (let i = 0; i < code.length; i++) {
    h = (h << 5) - h + code.charCodeAt(i);
    h |= 0;
  }
  return palette[Math.abs(h) % palette.length];
}

/* ================= ACTIVE BADGES ================= */
export function updateActiveBadges() {
  const selected =
    document.getElementById('moduleFilter')?.value || '';

  document.querySelectorAll('.fiori-badge').forEach(badge => {
    const mid = badge.dataset.moduleId;
    const isActive = selected && mid === selected;

    badge.classList.toggle('active', isActive);

    const close = badge.querySelector('.badge-close');
    if (close) close.style.display = isActive ? 'inline-flex' : 'none';
  });
}

/* ================= RENDER GRID ================= */
export function renderInstructionGrid(listData) {
  const list = document.getElementById('instructionsSection');
  const empty = document.getElementById('emptyState');

  list.innerHTML = '';

  if (!listData || !listData.length) {
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';

  listData.forEach(inst => {
    const card = document.createElement('div');
    card.className = 'card instruction-card';
    card.dataset.id = inst.id;

    const moduleObj = state.modules.find(m => m.id === inst.moduleId);

    const code = moduleObj?.code || '';
    const name = moduleObj?.name || inst.moduleId || 'Без модуля';

    const stepsShort = (inst.steps || [])
      .slice(0, 3)
      .map((s, idx) => `Шаг ${idx + 1}: ${escapeHtml(s)}`)
      .join('<br>');

    const hasMoreSteps = (inst.steps || []).length > 3;
    const notesShort = cropText(inst.notes || '', 180);

    const color =
      moduleObj?.color ||
      getColorForModule(code || name || inst.moduleId);

    card.style.setProperty('--module-color', color);

    card.innerHTML = `
      <div class="meta">
        <span class="fiori-badge clickable"
              data-module-id="${escapeHtml(inst.moduleId || '')}"
              title="${escapeHtml(name)}">
          <span class="fiori-badge-code"
                style="background:${escapeHtml(color)}">
            ${escapeHtml(code || name[0] || '')}
          </span>
          <span class="badge-close"
                style="display:none; margin-left:6px; cursor:pointer; font-weight:700;">
            ×
          </span>
        </span>
      </div>

      <h3>${escapeHtml(inst.title || 'Без названия')}</h3>

      <p class="meta">
        <strong>Транзакция:</strong>
        ${escapeHtml(inst.transactionCode || '-')}
      </p>

      <div class="content">
        ${
          stepsShort
            ? `<p>${stepsShort}${hasMoreSteps ? '<br>...' : ''}</p>`
            : '<p>Шаги не указаны</p>'
        }
        ${
          notesShort
            ? `<p><strong>Примечания:</strong> ${escapeHtml(notesShort)}</p>`
            : ''
        }
      </div>

      <div class="footer"
           style="margin-top:8px; display:flex; gap:8px;">
        <button type="button"
                class="secondary open-instruction"
                data-id="${escapeHtml(inst.id)}">
          Увидеть больше
        </button>
      </div>
    `;

    list.appendChild(card);
  });

  updateActiveBadges();
}
