// Кэш модулей и инструкций
let modulesCache = [];
let instructionsCache = [];

// ===== ЗАГРУЗКА МОДУЛЕЙ =====
async function loadModulesPublic() {
  const res = await fetch('data/modules.json');
  modulesCache = await res.json();

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
  const res = await fetch('data/instructions.json');
  instructionsCache = await res.json();

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

  const list = document.getElementById('instructionsSection');
  const empty = document.getElementById('emptyState');

  list.innerHTML = '';

  if (!filtered.length) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  filtered.forEach(inst => {
    const card = document.createElement('div');
    card.className = 'card instruction-card';
    card.dataset.id = inst.id;

    // краткие шаги (без нумерации от <ol>)
    const stepsShort = (inst.steps || []).slice(0, 3)
      .map((s, idx) => `<li>Шаг ${idx + 1}: ${s}</li>`).join('');
    const hasMoreSteps = (inst.steps || []).length > 3;

    const notesShort = inst.notes
      ? inst.notes.substring(0, 120) + (inst.notes.length > 120 ? '...' : '')
      : '';

    card.innerHTML = `
      <h3>${inst.title}</h3>
      <p><strong>Транзакция:</strong> ${inst.transactionCode || '-'}</p>
      ${
        stepsShort
          ? `<ul style="list-style:none; padding-left:0; margin:0;">
               ${stepsShort}${hasMoreSteps ? '<li>...</li>' : ''}
             </ul>`
          : '<p>Шаги не указаны</p>'
      }
      ${notesShort ? `<p><strong>Примечания:</strong> ${notesShort}</p>` : ''}
      <p style="margin-top:8px; font-size:13px; color:#6b7280;">Нажмите, чтобы открыть полную инструкцию</p>
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

  if (inst.steps && inst.steps.length) {
    const stepsHtml = inst.steps
      .map((s, idx) => `<li>Шаг ${idx + 1}: ${s}</li>`)
      .join('');
    stepsEl.innerHTML = `
      <h3>Шаги</h3>
      <ul style="list-style:none; padding-left:0; margin-top:4px;">
        ${stepsHtml}
      </ul>
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
document.getElementById('reloadBtn').addEventListener('click', () => {
  loadInstructionsPublic();
});

document.getElementById('searchInput').addEventListener('keyup', (e) => {
  if (e.key === 'Enter') {
    loadInstructionsPublic();
  }
});

document.getElementById('moduleFilter').addEventListener('change', () => {
  loadInstructionsPublic();
});

// Клик по карточке – открываем модалку
document.getElementById('instructionsSection').addEventListener('click', (e) => {
  const card = e.target.closest('.instruction-card');
  if (!card) return;
  const id = card.dataset.id;
  const inst = instructionsCache.find(i => i.id === id);
  if (!inst) return;
  openInstructionModal(inst);
});

// Закрытие модалки
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
