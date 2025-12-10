// Кэш модулей и инструкций
let modulesCache = [];
let instructionsCache = [];

/* ===== HELPERS ===== */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function cropText(text, maxLength = 180) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// Простая детерминированная функция, которая по коду возвращает цвет из палитры
function getColorForModule(code) {
  const palette = [
    '#0a6ed1', // синий
    '#0b9f6b', // зелёный
    '#f97316', // оранжевый
    '#7c3aed', // фиолетовый
    '#ef4444', // красный
    '#06b6d4', // бирюзовый
    '#f59e0b', // янтарный
    '#10b981', // мята
    '#6366f1', // индиго
    '#db2777'  // розовый
  ];
  if (!code) return palette[0];
  // хэшируем строку в число
  let h = 0;
  for (let i = 0; i < code.length; i++) {
    h = (h << 5) - h + code.charCodeAt(i);
    h |= 0;
  }
  const idx = Math.abs(h) % palette.length;
  return palette[idx];
}

/* ===== ЗАГРУЗКА МОДУЛЕЙ ===== */
async function loadModulesPublic() {
  try {
    const res = await fetch('data/modules.json');
    modulesCache = await res.json();
  } catch (err) {
    console.error('Ошибка загрузки modules.json', err);
    modulesCache = [];
  }

  const select = document.getElementById('moduleFilter');
  if (!select) return;
  select.innerHTML = '<option value="">Все модули</option>';
  modulesCache.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.textContent = `${m.code || ''} – ${m.name || ''}`.trim();
    select.appendChild(opt);
  });
}

/* ===== РЕНДЕР СЕТКИ ИНСТРУКЦИЙ ===== */
function renderInstructionGrid(listData) {
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

    // Получаем модуль по id (если есть) и формируем Fiori-метку
    const moduleObj = modulesCache.find(m => m.id === inst.moduleId);
    const code = moduleObj && moduleObj.code ? moduleObj.code : '';
    const name = moduleObj && moduleObj.name ? moduleObj.name : (inst.moduleId || 'Без модуля');

    // короткие шаги
    const stepsShort = (inst.steps || [])
      .slice(0, 3)
      .map((s, idx) => `Шаг ${idx + 1}: ${escapeHtml(s)}`)
      .join('<br>');

    const hasMoreSteps = (inst.steps || []).length > 3;
    const notesShort = cropText(inst.notes || '', 180);

    // Fiori-style badge: code in small box + name
    const color = getColorForModule(code || name);
    // badge кликабельный — добавляем data-module-id
    const badgeHtml = code
      ? `<span class="fiori-badge clickable" data-module-id="${escapeHtml(inst.moduleId)}">
           <span class="fiori-badge-code" style="background:${color}">${escapeHtml(code)}</span>
           <span class="fiori-badge-name">${escapeHtml(name)}</span>
         </span>`
      : `<span class="fiori-badge clickable" data-module-id="${escapeHtml(inst.moduleId)}">
           <span class="fiori-badge-name">${escapeHtml(name)}</span>
         </span>`;

    card.innerHTML = `
      <div class="meta">${badgeHtml}</div>
      <h3>${escapeHtml(inst.title || 'Без названия')}</h3>
      <p class="meta"><strong>Транзакция:</strong> ${escapeHtml(inst.transactionCode || '-')}</p>
      <div class="content">
        ${stepsShort ? `<p>${stepsShort}${hasMoreSteps ? '<br>...' : ''}</p>` : '<p>Шаги не указаны</p>'}
        ${notesShort ? `<p><strong>Примечания:</strong> ${escapeHtml(notesShort)}</p>` : ''}
      </div>
      <div class="footer" style="margin-top:8px; display:flex; gap:8px; align-items:center;">
        <button type="button" class="secondary open-instruction" data-id="${inst.id}">Увидеть больше</button>
      </div>
    `;
    list.appendChild(card);
  });
}

/* ===== ЗАГРУЗКА ИНСТРУКЦИЙ ===== */
async function loadInstructionsPublic() {
  try {
    const res = await fetch('data/instructions.json');
    instructionsCache = await res.json();
  } catch (err) {
    console.error('Ошибка загрузки instructions.json', err);
    instructionsCache = [];
  }

  const search = (document.getElementById('searchInput')?.value || '').trim().toLowerCase();
  const moduleId = (document.getElementById('moduleFilter')?.value || '').trim();

  let filtered = instructionsCache.slice();

  if (moduleId) {
    filtered = filtered.filter(i => i.moduleId === moduleId);
  }

  if (search) {
    filtered = filtered.filter(i => {
      const inTitle = (i.title || '').toLowerCase().includes(search);
      const inTx = (i.transactionCode || '').toLowerCase().includes(search);
      const inNotes = (i.notes || '').toLowerCase().includes(search);
      return inTitle || inTx || inNotes;
    });
  }

  renderInstructionGrid(filtered);
}

/* ===== МОДАЛКА (просмотр инструкции) ===== */
function openInstructionModal(inst) {
  const backdrop = document.getElementById('instructionModalBackdrop');
  const titleEl = document.getElementById('modalTitle');
  const txEl = document.getElementById('modalTransaction');
  const stepsEl = document.getElementById('modalSteps');
  const notesEl = document.getElementById('modalNotes');
  const mediaEl = document.getElementById('modalMedia');

  titleEl.textContent = inst.title || 'Инструкция';
  txEl.textContent = inst.transactionCode || '-';

  if (inst.steps && inst.steps.length) {
    const stepsHtml = inst.steps
      .map((s, idx) => `<div class="step">Шаг ${idx + 1}: ${escapeHtml(s)}</div>`)
      .join('');
    stepsEl.innerHTML = `<h3>Шаги</h3><div class="steps-block">${stepsHtml}</div>`;
  } else {
    stepsEl.innerHTML = '<p><em>Шаги не указаны</em></p>';
  }

  if (inst.notes) {
    notesEl.innerHTML = `<h3>Примечания</h3><p>${escapeHtml(inst.notes)}</p>`;
  } else {
    notesEl.innerHTML = '';
  }

  mediaEl.innerHTML = '';
  (inst.media || []).forEach(m => {
    let el;
    if (m.type === 'image') {
      el = document.createElement('img');
      el.src = m.url;
      el.style.cursor = 'zoom-in';
      el.className = 'media-thumb';
      el.addEventListener('click', () => openImageLightbox(m.url));
    } else {
      el = document.createElement('video');
      el.src = m.url;
      el.controls = true;
      el.className = 'media-thumb';
    }
    mediaEl.appendChild(el);
  });

  backdrop.style.display = 'flex';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function closeInstructionModal() {
  const backdrop = document.getElementById('instructionModalBackdrop');
  backdrop.style.display = 'none';
}

/* ===== ЛАЙТБОКС КАРТИНОК ===== */
function openImageLightbox(src) {
  const lb = document.getElementById('imageLightbox');
  const img = document.getElementById('lightboxImg');
  img.src = src;
  lb.style.display = 'flex';
}
function closeImageLightbox() {
  const lb = document.getElementById('imageLightbox');
  const img = document.getElementById('lightboxImg');
  img.src = '';
  lb.style.display = 'none';
}
document.getElementById('imageLightbox')?.addEventListener('click', (e) => {
  if (e.target.id === 'imageLightbox') closeImageLightbox();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeInstructionModal();
    closeImageLightbox();
  }
});

/* ===== СЛУШАТЕЛИ ===== */

// Обновление: сброс поиска и фильтра и перерисовка
document.getElementById('reloadBtn')?.addEventListener('click', async () => {
  const searchInput = document.getElementById('searchInput');
  const moduleFilter = document.getElementById('moduleFilter');
  if (searchInput) searchInput.value = '';
  if (moduleFilter) moduleFilter.value = '';

  await loadModulesPublic();
  await loadInstructionsPublic();

  const main = document.querySelector('main');
  if (main) {
    const top = main.getBoundingClientRect().top + window.scrollY - 8;
    window.scrollTo({ top, behavior: 'smooth' });
  }
});

// Поиск по Enter
document.getElementById('searchInput')?.addEventListener('keyup', (e) => {
  if (e.key === 'Enter') loadInstructionsPublic();
});

// Фильтр
document.getElementById('moduleFilter')?.addEventListener('change', () => loadInstructionsPublic());

// Обработчик кликов по секции инструкций:
// - клик по .fiori-badge -> устанавливаем фильтр по модулю
// - клик по кнопке "Увидеть больше" -> открываем модал
// - клик по карточке -> открываем модал
document.getElementById('instructionsSection')?.addEventListener('click', (e) => {
  // клик по метке
  const badge = e.target.closest('.fiori-badge.clickable');
  if (badge) {
    const moduleId = badge.dataset.moduleId;
    if (!moduleId) return;
    const moduleFilter = document.getElementById('moduleFilter');
    moduleFilter.value = moduleId;
    loadInstructionsPublic();
    // плавно прокрутить к началу
    const main = document.querySelector('main');
    if (main) {
      const top = main.getBoundingClientRect().top + window.scrollY - 8;
      window.scrollTo({ top, behavior: 'smooth' });
    }
    return;
  }

  const btn = e.target.closest('.open-instruction');
  if (btn) {
    const id = btn.dataset.id;
    const inst = instructionsCache.find(i => i.id === id);
    if (!inst) { alert('Инструкция не найдена'); return; }
    openInstructionModal(inst);
    return;
  }

  const card = e.target.closest('.instruction-card');
  if (!card) return;
  const id = card.dataset.id;
  const inst = instructionsCache.find(i => i.id === id);
  if (!inst) return;
  openInstructionModal(inst);
});

// Закрытие модалки
document.getElementById('modalCloseBtn')?.addEventListener('click', closeInstructionModal);
document.getElementById('instructionModalBackdrop')?.addEventListener('click', (e) => {
  if (e.target.id === 'instructionModalBackdrop') closeInstructionModal();
});

/* ===== INIT ===== */
(async function init() {
  await loadModulesPublic();
  await loadInstructionsPublic();

  // открыть по ?inst=ID если есть
  const params = new URLSearchParams(window.location.search);
  const instId = params.get('inst');
  if (instId) {
    const inst = instructionsCache.find(i => i.id === instId);
    if (inst) setTimeout(() => openInstructionModal(inst), 300);
  }
})();
