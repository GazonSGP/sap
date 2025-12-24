// ui/dockController.js

import { workspace } from '../state/workspace.js';
import { state } from '../state/cache.js';
import { renderInstructionCard } from '../render/grid.js';
import { openInstruction, closeInstruction } from '../render/workspace.js';

export function syncDock() {
  const dock = document.getElementById('dock');
  if (!dock) return;

  // если нет открытых инструкций — скрываем dock
  if (!workspace.open.length) {
    dock.classList.add('is-hidden');
    dock.innerHTML = '';
    return;
  }

  dock.classList.remove('is-hidden');

  // базовая структура dock: header + body (body скроллится)
  dock.innerHTML = `
    <div class="dock-header">Открытые инструкции</div>
    <div class="dock-body"></div>
  `;

  const body = dock.querySelector('.dock-body');

  const grid = document.createElement('div');
  grid.className = 'dock-grid';

  workspace.open.forEach(id => {
    const inst = state.instructions.find(i => i.id === id);
    if (!inst) return;

    // используем тот же рендер карточки, что и в основном гриде
    const wrapper = document.createElement('div');
    wrapper.innerHTML = renderInstructionCard(inst);

    const card = wrapper.firstElementChild;
    if (!card) return;

    // помечаем как dock-карточку
    card.classList.add('is-dock');

    if (workspace.active === id) {
      card.classList.add('is-active');
    }

    // в dock используем module.code
    const badge = card.querySelector('.fiori-badge-code');
    if (badge) {
      const module = state.modules.find(m => m.id === inst.moduleId);
      if (module?.code) {
        badge.textContent = module.code;
      }
    }

    // крестик закрытия
    const closeBtn = document.createElement('button');
    closeBtn.className = 'dock-card-close';
    closeBtn.textContent = '×';

    closeBtn.addEventListener('click', e => {
      e.stopPropagation();
      closeInstruction(id);
    });

    card.appendChild(closeBtn);

    // клик по всей карточке открывает инструкцию
    card.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      openInstruction(id);
    });

    grid.appendChild(card);
  });

  body.appendChild(grid);
}
