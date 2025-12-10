// docs/js/public.js — Полная версия с двухколоночной модалкой (текст слева, медиа справа)
// Включает: загрузку данных, рендер карточек, компактные Fiori-метки, модалка two-column,
// корректный перенос в примечаниях, скрытие стрелок если медиа <= 1, лайтбокс.

// --------- КЭШИ ---------
let modulesCache = [];
let instructionsCache = [];

// --------- HELPERS ---------
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

// --------- ЗАГРУЗКА modules.json ---------
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

// --------- РЕНДЕР СЕТКИ ИНСТРУКЦИЙ ---------
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

    const moduleObj = modulesCache.find(m => m.id === inst.moduleId);
    const code = moduleObj && moduleObj.code ? moduleObj.code : '';
    const name = moduleObj && moduleObj.name ? moduleObj.name : (inst.moduleId || 'Без модуля');

    const stepsShort = (inst.steps || [])
      .slice(0, 3)
      .map((s, idx) => `Шаг ${idx + 1}: ${escapeHtml(s)}`)
      .join('<br>');

    const hasMoreSteps = (inst.steps || []).length > 3;
    const notesShort = cropText(inst.notes || '', 180);

    const color = getColorForModule(code || name);

    const badgeHtml = code
      ? `<span class="fiori-badge clickable" data-module-id="${escapeHtml(inst.moduleId)}" title="${escapeHtml(name)}">
           <span class="fiori-badge-code" style="background:${color}">${escapeHtml(code)}</span>
         </span>`
      : `<span class="fiori-badge clickable" data-module-id="${escapeHtml(inst.moduleId)}" title="${escapeHtml(name)}">
           <span class="fiori-badge-code" style="background:${color}">${escapeHtml((name && name[0]) || '')}</span>
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
        <button type="button" class="secondary open-instruction" data-id="${escapeHtml(inst.id)}">Увидеть больше</button>
      </div>
    `;
    list.appendChild(card);
  });

  updateActiveBadges();
}

function updateActiveBadges() {
  const selectedModule = document.getElementById('moduleFilter')?.value || '';
  document.querySelectorAll('.fiori-badge').forEach(b => {
    const mid = b.dataset.moduleId || '';
    if (!selectedModule) {
      b.classList.remove('active');
    } else {
      b.classList.toggle('active', mid === selectedModule);
    }
  });
}

// --------- ЗАГРУЗКА instructions.json ---------
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

// --------- МОДАЛКА (двухколоночная) ---------
function openInstructionModal(inst) {
  const backdrop = document.getElementById('instructionModalBackdrop');
  if (!backdrop) return;
  const modalWindow = backdrop.querySelector('.modal-window');

  modalWindow.innerHTML = `
    <div class="modal-header" role="banner">
      <div style="display:flex; gap:12px; align-items:center;">
        <div id="modalBadgePlaceholder"></div>
        <h2 id="modalTitle" style="margin:0; font-size:18px;"></h2>
      </div>
      <div style="display:flex; gap:8px; align-items:center;">
        <button id="modalCloseBtn" class="secondary" type="button">Закрыть</button>
      </div>
    </div>

    <div class="modal-left" aria-live="polite" style="padding-right:6px;">
      <p style="margin:6px 0; font-size:13px;"><strong>Транзакция:</strong> <span id="modalTransaction"></span></p>
      <div id="modalSteps"></div>
      <div id="modalNotes"></div>
    </div>

    <div id="modalMedia" class="modal-right" aria-hidden="false"></div>
  `;

  const titleEl = modalWindow.querySelector('#modalTitle');
  const txEl = modalWindow.querySelector('#modalTransaction');
  const stepsEl = modalWindow.querySelector('#modalSteps');
  const notesEl = modalWindow.querySelector('#modalNotes');
  const mediaContainer = modalWindow.querySelector('#modalMedia');
  const badgePlaceholder = modalWindow.querySelector('#modalBadgePlaceholder');
  const closeBtn = modalWindow.querySelector('#modalCloseBtn');

  titleEl.textContent = inst.title || 'Инструкция';
  txEl.textContent = inst.transactionCode || '-';

  const moduleObj = modulesCache.find(m => m.id === inst.moduleId);
  const code = moduleObj && moduleObj.code ? moduleObj.code : '';
  const name = moduleObj && moduleObj.name ? moduleObj.name : (inst.moduleId || 'Без модуля');
  const color = getColorForModule(code || name);
  const badgeHtml = code
    ? `<span class="fiori-badge" title="${escapeHtml(name)}"><span class="fiori-badge-code" style="background:${color}">${escapeHtml(code)}</span></span>`
    : `<span class="fiori-badge" title="${escapeHtml(name)}"><span class="fiori-badge-code" style="background:${color}">${escapeHtml((name && name[0]) || '')}</span></span>`;
  badgePlaceholder.innerHTML = badgeHtml;

  if (inst.steps && inst.steps.length) {
    const stepsHtml = inst.steps
      .map((s, idx) => `<div class="step">Шаг ${idx + 1}: ${escapeHtml(s)}</div>`)
      .join('');
    stepsEl.innerHTML = `<h3>Шаги</h3><div class="steps-block">${stepsHtml}</div>`;
  } else {
    stepsEl.innerHTML = '<p><em>Шаги не указаны</em></p>';
  }

  if (inst.notes) {
    notesEl.innerHTML = `<h3>Примечания</h3><div class="modal-notes">${escapeHtml(inst.notes)}</div>`;
  } else {
    notesEl.innerHTML = '';
  }

  mediaContainer.innerHTML = '';
  const mainPreview = document.createElement('div');
  mainPreview.className = 'modal-main-media';
  const thumbsColumn = document.createElement('div');
  thumbsColumn.className = 'modal-thumbs';
  const controlsRow = document.createElement('div');
  controlsRow.className = 'media-controls';

  mediaContainer.appendChild(mainPreview);
  mediaContainer.appendChild(thumbsColumn);
  mediaContainer.appendChild(controlsRow);

  const mediaList = Array.isArray(inst.media) ? inst.media.slice() : [];

  if (!mediaList.length) {
    mainPreview.innerHTML = '<div style="padding:18px;color:#6b7280">Нет медиа</div>';
    controlsRow.classList.add('hidden');
    thumbsColumn.innerHTML = '';
    backdrop.style.display = 'flex';
    closeBtn.addEventListener('click', closeInstructionModal);
    return;
  }

  let currentIndex = 0;
  function renderMain(idx) {
    mainPreview.innerHTML = '';
    const m = mediaList[idx];
    if (m.type === 'image') {
      const img = document.createElement('img');
      img.src = m.url;
      img.alt = inst.title || 'image';
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', () => openImageLightbox(m.url));
      mainPreview.appendChild(img);
    } else {
      const video = document.createElement('video');
      video.src = m.url;
      video.controls = true;
      video.style.maxHeight = '100%';
      mainPreview.appendChild(video);
    }
    thumbsColumn.querySelectorAll('.thumb').forEach((t, i) => {
      t.classList.toggle('active', i === idx);
    });
    currentIndex = idx;
  }

  thumbsColumn.innerHTML = '';
  mediaList.forEach((m, i) => {
    const t = document.createElement('div');
    t.className = 'thumb';
    t.dataset.index = i;
    if (m.type === 'image') {
      const img = document.createElement('img');
      img.src = m.url;
      t.appendChild(img);
    } else {
      const vid = document.createElement('video');
      vid.src = m.url;
      vid.muted = true;
      vid.loop = true;
      vid.play().catch(()=>{/* ignore autoplay */});
      t.appendChild(vid);
    }
    t.addEventListener('click', () => renderMain(i));
    thumbsColumn.appendChild(t);
  });

  if (mediaList.length > 1) {
    controlsRow.classList.remove('hidden');
    controlsRow.innerHTML = `
      <div style="display:flex;gap:8px;">
        <button type="button" class="secondary modal-prev">◀</button>
        <button type="button" class="secondary modal-next">▶</button>
      </div>
      <div style="display:flex;gap:8px;">
        <button type="button" class="secondary modal-download">Скачать медиа</button>
      </div>
    `;

    controlsRow.querySelector('.modal-prev').addEventListener('click', () => {
      const next = (currentIndex - 1 + mediaList.length) % mediaList.length;
      renderMain(next);
    });
    controlsRow.querySelector('.modal-next').addEventListener('click', () => {
      const next = (currentIndex + 1) % mediaList.length;
      renderMain(next);
    });

    controlsRow.querySelectorAll('.modal-download')?.forEach(el => {
      el.addEventListener('click', () => {
        mediaList.forEach(m => {
          const a = document.createElement('a');
          a.href = m.url;
          a.download = m.url.split('/').pop();
          a.target = '_blank';
          document.body.appendChild(a);
          a.click();
          a.remove();
        });
      });
    });
  } else {
    controlsRow.classList.add('hidden');
    // отдельная кнопка загрузки для одного медиа
    const dl = document.createElement('div');
    dl.style.display = 'flex';
    dl.style.justifyContent = 'flex-end';
    dl.style.marginTop = '8px';
    const btn = document.createElement('button');
    btn.className = 'secondary modal-download';
    btn.textContent = 'Скачать медиа';
    btn.addEventListener('click', () => {
      const m = mediaList[0];
      const a = document.createElement('a');
      a.href = m.url;
      a.download = m.url.split('/').pop();
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      a.remove();
    });
    dl.appendChild(btn);
    mediaContainer.appendChild(dl);
  }

  renderMain(0);

  backdrop.style.display = 'flex';
  closeBtn.addEventListener('click', closeInstructionModal);

  const left = modalWindow.querySelector('.modal-left');
  if (left) left.scrollTop = 0;
}

// --------- Закрытие модалки ---------
function closeInstructionModal() {
  const backdrop = document.getElementById('instructionModalBackdrop');
  if (!backdrop) return;
  backdrop.style.display = 'none';
}

// --------- ЛАЙТБОКС ---------
function openImageLightbox(src) {
  const lb = document.getElementById('imageLightbox');
  const img = document.getElementById('lightboxImg');
  if (!lb || !img) return;
  img.src = src;
  lb.style.display = 'flex';
}
function closeImageLightbox() {
  const lb = document.getElementById('imageLightbox');
  const img = document.getElementById('lightboxImg');
  if (!lb || !img) return;
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

// --------- СЛУШАТЕЛИ ---------
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

document.getElementById('searchInput')?.addEventListener('keyup', (e) => {
  if (e.key === 'Enter') loadInstructionsPublic();
});

document.getElementById('moduleFilter')?.addEventListener('change', () => {
  loadInstructionsPublic();
  updateActiveBadges();
});

document.getElementById('instructionsSection')?.addEventListener('click', (e) => {
  const badge = e.target.closest('.fiori-badge.clickable');
  if (badge) {
    const moduleId = badge.dataset.moduleId;
    if (!moduleId) return;
    const moduleFilter = document.getElementById('moduleFilter');
    moduleFilter.value = moduleId;
    loadInstructionsPublic();
    updateActiveBadges();
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

document.getElementById('instructionModalBackdrop')?.addEventListener('click', (e) => {
  if (e.target.id === 'instructionModalBackdrop') closeInstructionModal();
});

// --------- INIT ---------
(async function init() {
  await loadModulesPublic();
  await loadInstructionsPublic();

  const params = new URLSearchParams(window.location.search);
  const instId = params.get('inst');
  if (instId) {
    const inst = instructionsCache.find(i => i.id === instId);
    if (inst) setTimeout(() => openInstructionModal(inst), 300);
  }

  updateActiveBadges();
})();
