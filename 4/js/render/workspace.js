// render/workspace.js
import { workspace } from '../state/workspace.js';
import { state } from '../state/cache.js';
import { openInstructionModal, closeInstructionModal } from './modal.js';
import { syncDock } from '../ui/dockController.js';

/* ================= OPEN ================= */

export function openInstruction(instId) {
  const inst = state.instructions.find(i => i.id === instId);
  if (!inst) return;

  if (!workspace.open.includes(instId)) {
    workspace.open.push(instId);
  }

  workspace.active = instId;

  // история может остаться, UI её не использует
  if (workspace.history) {
    workspace.history = workspace.history.filter(id => id !== instId);
    workspace.history.push(instId);
    if (workspace.history.length > 15) {
      workspace.history.shift();
    }
  }

  openInstructionModal(inst);

  // ✅ ВАЖНО: обновляем dock ПОСЛЕ изменения состояния
  syncDock();
}

/* ================= CLOSE ================= */

export function closeInstruction(instId) {
  const wasActive = workspace.active === instId;

  workspace.open = workspace.open.filter(id => id !== instId);

  if (wasActive) {
    closeInstructionModal();
    workspace.active = workspace.open.at(-1) || null;

    if (workspace.active) {
      const inst = state.instructions.find(i => i.id === workspace.active);
      if (inst) openInstructionModal(inst);
    }
  }

  // обновляем dock и при закрытии
  syncDock();
}
