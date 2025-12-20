// Загрузка modules.json (1 в 1 по поведению)

import { state } from '../state/cache.js';

export async function loadModulesPublic() {
  try {
    const res = await fetch('data/modules.json', { cache: 'no-store' });
    state.modules = await res.json();
  } catch (err) {
    console.error('Ошибка загрузки modules.json', err);
    state.modules = [];
  }

  const select = document.getElementById('moduleFilter');
  if (!select) return;

  select.innerHTML = '<option value="">Все модули</option>';

  state.modules.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.textContent = `${m.code || ''} – ${m.name || ''}`.trim();
    select.appendChild(opt);
  });
}
