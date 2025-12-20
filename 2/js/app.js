import { state } from './state/cache.js';
import { loadModulesPublic } from './api/modules.js';
import { loadInstructionsPublic } from './api/instructions.js';
import { updateActiveBadges } from './render/grid.js';
import {
  openInstructionModal,
  closeInstructionModal
} from './render/modal.js';
import {
  init3DCards,
  init3DToggle
} from './ui/card3d.js';

/* ================= INIT ================= */

(async function init() {
  await loadModulesPublic();
  await loadInstructionsPublic();

  // 🔥 инициализация переключателя 3D
  init3DToggle();

  // 🔥 инициализация 3D карточек ПОСЛЕ рендера
  init3DCards();

  const params = new URLSearchParams(window.location.search);
  const instId = params.get('inst');
  if (instId) {
    const inst = state.instructions.find(i => i.id === instId);
    if (inst) {
      setTimeout(() => openInstructionModal(inst), 300);
    }
  }

  updateActiveBadges();
})();

/* ================= LISTENERS ================= */

document.getElementById('reloadBtn')?.addEventListener('click', async () => {
  const search = document.getElementById('searchInput');
  const filter = document.getElementById('moduleFilter');
  if (search) search.value = '';
  if (filter) filter.value = '';

  await loadModulesPublic();
  await loadInstructionsPublic();

  // 🔥 повторная инициализация 3D после перерендера
  init3DCards();

  const main = document.querySelector('main');
  if (main) {
    const top = main.getBoundingClientRect().top + window.scrollY - 8;
    window.scrollTo({ top, behavior: 'smooth' });
  }
});

document.getElementById('searchInput')?.addEventListener('keyup', e => {
  if (e.key === 'Enter') {
    loadInstructionsPublic().then(init3DCards);
  }
});

document.getElementById('moduleFilter')?.addEventListener('change', () => {
  loadInstructionsPublic().then(init3DCards);
  updateActiveBadges();
});

document.getElementById('instructionsSection')?.addEventListener('click', e => {
  const badge = e.target.closest('.fiori-badge.clickable');
  if (badge) {
    const moduleId = badge.dataset.moduleId;
    const filter = document.getElementById('moduleFilter');
    if (filter) {
      filter.value = moduleId;
      loadInstructionsPublic().then(init3DCards);
      updateActiveBadges();
    }
    return;
  }

  const btn = e.target.closest('.open-instruction');
  if (btn) {
    const id = btn.dataset.id;
    const inst = state.instructions.find(i => i.id === id);
    if (inst) openInstructionModal(inst);
    return;
  }

  const card = e.target.closest('.instruction-card');
  if (card) {
    const inst = state.instructions.find(i => i.id === card.dataset.id);
    if (inst) openInstructionModal(inst);
  }
});

document.getElementById('instructionModalBackdrop')
  ?.addEventListener('click', e => {
    if (e.target.id === 'instructionModalBackdrop') {
      closeInstructionModal();
    }
  });

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeInstructionModal();
});
