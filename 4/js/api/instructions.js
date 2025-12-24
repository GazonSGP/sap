// Загрузка instructions.json + фильтрация (как в оригинале)

import { state } from '../state/cache.js';
import { renderInstructionGrid } from '../render/grid.js';

export async function loadInstructionsPublic() {
  try {
    const res = await fetch('data/instructions.json', { cache: 'no-store' });
    state.instructions = await res.json();
  } catch (err) {
    console.error('Ошибка загрузки instructions.json', err);
    state.instructions = [];
  }

  const search =
    (document.getElementById('searchInput')?.value || '')
      .trim()
      .toLowerCase();

  const moduleId =
    (document.getElementById('moduleFilter')?.value || '')
      .trim();

  let filtered = state.instructions.slice();

  if (moduleId) {
    filtered = filtered.filter(i => i.moduleId === moduleId);
  }

  if (search) {
    filtered = filtered.filter(i => {
      return (
        (i.title || '').toLowerCase().includes(search) ||
        (i.transactionCode || '').toLowerCase().includes(search) ||
        (i.notes || '').toLowerCase().includes(search)
      );
    });
  }

  renderInstructionGrid(filtered);
}
