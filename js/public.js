// Кэш модулей и инструкций
let modulesCache = [];
let instructionsCache = [];

// ===== ЗАГРУЗКА МОДУЛЕЙ =====
async function loadModulesPublic() {
  try {
    const res = await fetch('data/modules.json');
    modulesCache = await res.json();
  } catch (err) {
    console.error('Ошибка загрузки modules.json', err);
    modulesCache = [];
  }

  const select = document.getElementById('moduleFilter');
  select.innerHTML = '<option value="">Все модули</option>';
  modulesCache.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.textContent = `${m.code} – ${m.name}`;
    select.appendChild(opt);
  });
}

// ===== ЗАГРУЗКА ИНСТРУКЦИЙ =====
async function loadInstructionsPublic() {
  try {
    const res = await fetch('data/instructions.json');
    instructionsCache = await res.json();
  } catch (err) {
    console.error('Ошибка загрузки instructions.json', err);
    instructionsCache = [];
  }

  const search = document.getElementById('searchInput').value.trim().toLowerCase();
  const moduleId = document.getElementById('moduleFilter').value;

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

function cropText(text, maxLength = 180) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

function renderInstructionGrid(listData) {
  const list = document.getElementById('instructionsSection');
  const empty = document.getElementById('emptyState');

  list.innerHTML = '';

  if (!listData.length) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  listData.forEach(inst => {
    const card = document.createElement('div');
    card.className = 'card instruction-card';
    card.dataset.id = inst.id;

    // краткие шаги — без списков, просто текст (ограничение по длине)
    const stepsShort = (inst.steps || [])
      .slice(0, 3)
      .map((s, idx) => `Шаг ${idx + 1}: ${s}`)
      .join('<br>');

    const hasMoreSteps = (inst.steps || []).length > 3;
    const notesShort = cropText(inst.notes || '', 180);

    card.innerHTML = `
      <div class="meta"><span class="badge">${inst.moduleId || ''}</span></div>
      <h3>${inst.title}</h3>
      <p class="meta"><strong>Транзакция:</strong> ${inst.transactionCode || '-'}</p>
      <div class="content">
        ${stepsShort ? `<p>${stepsShort}${hasMoreSteps ? '<br>...' : ''}</p>` : '<p>Шаги не указаны</p>'}
        ${notesShort ? `<p><strong>Примечания:</strong> ${notesShort}</p>` : ''}
      </div>
      <div class="footer" style="margin-top:8px; display:flex; gap:8px; align-items:center;">
        <button type="button" class="secondary open-instruction" data-id="${inst.id}">Увидеть больше</button>
      </div>
    `;
    list.appendChild(card);
  });
}

// ---------- МОДАЛКА ИНСТРУКЦИИ ----------
function openInstructionModal(inst) {
  const backdrop = document.getElementById('instructionModalBackdrop');
  const titleEl = document.getElementById('modalTitle');
  const txEl = document.getElementById('modalTransaction');
  const stepsEl = document.getElementById('modalSteps');
  const notesEl = document.getElementById('modalNotes');
  const mediaEl = document.getElementById('modalMedia');

  titleEl.textContent = inst.title || 'Инструкция';
  txEl.textContent = inst.transactionCode || '-';

  // ПОЛНЫЕ шаги — без списков
  if (inst.steps && inst.steps.length) {
    const stepsHtml = inst.steps
      .map((s, idx) => `<div class="step">Шаг ${idx + 1}: ${s}</div>`)
      .join('');
    stepsEl.innerHTML = `
      <h3>Шаги</h3>
      <div class="steps-block">${stepsHtml}</div>
    `;
  } else {
    stepsEl.innerHTML = '<p><em>Шаги не указаны</em></p>';
  }

  if (inst.notes) {
    notesEl.innerHTML = `<h3>Примечания</h3><p>${inst.notes}</p>`;
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

  // прокрутить страницу так, чтобы модал был виден (на всякий случай)
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function closeInstructionModal() {
  const backdrop = document.getElementById('instructionModalBackdrop');
  backdrop.style.display = 'none';
}

// ---------- ЛАЙТБОКС ДЛЯ КАРТИНОК ----------
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

document.getElementById('imageLightbox').addEventListener('click', (e) => {
  if (e.target.id === 'imageLightbox') {
    closeImageLightbox();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeInstructionModal();
    closeImageLightbox();
  }
});

// ---------- СЛУШАТЕЛИ ----------

// Обновление: сбрасываем поиск/фильтр и перерисовываем сетку.
// Теперь "Обновить" возвращает к "Все модули" и пустому поиску.
document.getElementById('reloadBtn').addEventListener('click', async () => {
  // Сброс поиска и фильтра (визуально)
  const searchInput = document.getElementById('searchInput');
  const moduleFilter = document.getElementById('moduleFilter');
  if (searchInput) searchInput.value = '';
  if (moduleFilter) moduleFilter.value = '';

  // Перезагрузим модули (чтобы select был актуален) и инструкции
  await loadModulesPublic();
  await loadInstructionsPublic();

  // Прокрутить к началу основного контента
  const main = document.querySelector('main');
  if (main) {
    const top = main.getBoundingClientRect().top + window.scrollY - 8;
    window.scrollTo({ top, behavior: 'smooth' });
  }
});

// Поиск по Enter
document.getElementById('searchInput').addEventListener('keyup', (e) => {
  if (e.key === 'Enter') {
    loadInstructionsPublic();
  }
});

// Фильтр по модулю
document.getElementById('moduleFilter').addEventListener('change', () => {
  loadInstructionsPublic();
});

// Клик по карточке или по кнопке "Увидеть больше" — открываем модалку
document.getElementById('instructionsSection').addEventListener('click', (e) => {
  // если нажата кнопка "Увидеть больше"
  const btn = e.target.closest('.open-instruction');
  if (btn) {
    const id = btn.dataset.id;
    const inst = instructionsCache.find(i => i.id === id);
    if (!inst) {
      alert('Инструкция не найдена');
      return;
    }
    openInstructionModal(inst);
    return;
  }

  // иначе если клик по карточке (не по кнопке)
  const card = e.target.closest('.instruction-card');
  if (!card) return;
  const id = card.dataset.id;
  const inst = instructionsCache.find(i => i.id === id);
  if (!inst) return;
  openInstructionModal(inst);
});

// Закрытие модалки инструкции
document.getElementById('modalCloseBtn').addEventListener('click', closeInstructionModal);
document.getElementById('instructionModalBackdrop').addEventListener('click', (e) => {
  if (e.target.id === 'instructionModalBackdrop') {
    closeInstructionModal();
  }
});

// ===== INIT =====
(async function init() {
  await loadModulesPublic();
  await loadInstructionsPublic();
})();
