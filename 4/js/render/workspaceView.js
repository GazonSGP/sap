import { workspace } from '../state/workspace.js';
import { state } from '../state/cache.js';
import { renderInstructionFull } from './instructionView.js';

export function renderInstruction() {
  const single = document.getElementById('singleView');
  const compare = document.getElementById('compareView');
  const grid = document.getElementById('instructionsSection');

  /* ===== НИЧЕГО НЕ ОТКРЫТО ===== */
  if (!workspace.open.length) {
    if (grid) grid.style.display = '';
    compare.style.display = 'none';
    single.style.display = 'block';
    return;
  }

  /* ===== СКРЫВАЕМ GRID ===== */
  if (grid) grid.style.display = 'none';

  /* ===== COMPARE MODE ===== */
  if (workspace.compare.length === 2) {
    single.style.display = 'none';
    compare.style.display = 'grid';

    document.getElementById('compareLeft').innerHTML =
      renderInstructionFull(
        state.instructions.find(i => i.id === workspace.compare[0])
      );

    document.getElementById('compareRight').innerHTML =
      renderInstructionFull(
        state.instructions.find(i => i.id === workspace.compare[1])
      );

    return;
  }

  /* ===== SINGLE MODE ===== */
  compare.style.display = 'none';
  single.style.display = 'block';

  const inst = state.instructions.find(i => i.id === workspace.active);
  if (!inst) return;

  single.innerHTML = renderInstructionFull(inst);
}
