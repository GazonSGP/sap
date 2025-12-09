// Проверяем, что есть токен, иначе выкидываем на логин
if (!getToken()) {
  window.location.href = 'login.html';
}

let currentMedia = [];

// ===== ХЕЛПЕР: АВТО-РЕСАЙЗ ДЛЯ TEXTAREA =====
function autoResizeTextarea(el) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
}

function setupAutoResizeForTextareas() {
  const areas = document.querySelectorAll('#instructionForm textarea[name="steps"], #instructionForm textarea[name="notes"]');
  areas.forEach(area => {
    autoResizeTextarea(area); // на всякий случай один раз
    area.addEventListener('input', () => autoResizeTextarea(area));
  });
}

// ===== ЗАГРУЗКА МОДУЛЕЙ =====
async function loadModules() {
  const res = await apiFetch('/api/modules');
  const modules = await res.json();

  const modulesList = document.getElementById('modulesList');
  const moduleSelect = document.querySelector('#instructionForm select[name="moduleId"]');
  modulesList.innerHTML = '';
  moduleSelect.innerHTML = '<option value="">Выберите модуль</option>';

  modules.forEach(m => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div><span class="badge">${m.code}</span></div>
          <div style="margin-top:4px;"><strong>${m.name}</strong></div>
        </div>
        <div style="display:flex; gap:8px;">
          <button type="button" data-id="${m.id}" class="edit-module">✏️</button>
          <button type="button" data-id="${m.id}" class="delete-module danger">🗑</button>
        </div>
      </div>
    `;
    modulesList.appendChild(card);

    const opt = document.createElement('option');
    opt.value = m.id;
    opt.textContent = `${m.code} – ${m.name}`;
    moduleSelect.appendChild(opt);
  });
}

// ===== ЗАГРУЗКА ИНСТРУКЦИЙ (КОМПАКТНЫЙ ВИД) =====
async function loadInstructions() {
  const res = await apiFetch('/api/instructions');
  const instructions = await res.json();
  const list = document.getElementById('instructionsList');
  list.innerHTML = '';

  instructions.forEach(inst => {
    const card = document.createElement('div');
    card.className = 'card';

    const stepsShort = (inst.steps || []).slice(0, 3)
      .map((s, idx) => `<li>Шаг ${idx + 1}: ${s}</li>`).join('');
    const hasMoreSteps = (inst.steps || []).length > 3;

    const notesShort = inst.notes
      ? inst.notes.substring(0, 140) + (inst.notes.length > 140 ? '...' : '')
      : '';

    const mediaCount = (inst.media && inst.media.length) ? inst.media.length : 0;
    const mediaInfo = mediaCount
      ? `<p style="font-size:12px; color:#6b7280;">Медиа: ${mediaCount} файл(ов)</p>`
      : '';

    card.innerHTML = `
      <h3>${inst.title}</h3>
      <p><strong>Транзакция:</strong> ${inst.transactionCode || '-'}</p>
      ${stepsShort
        ? `<ol>${stepsShort}${hasMoreSteps ? '<li>...</li>' : ''}</ol>`
        : '<p><em>Шаги не указаны</em></p>'}
      ${notesShort ? `<p><strong>Примечания:</strong> ${notesShort}</p>` : ''}
      ${mediaInfo}
      <p style="margin-top:4px; font-size:12px; color:#9ca3af;">
        Нажмите «Редактировать», чтобы увидеть и изменить полную инструкцию
      </p>
      <div style="margin-top:8px; display:flex; gap:8px;">
        <button type="button" class="edit-instruction" data-id="${inst.id}">✏️ Редактировать</button>
        <button type="button" class="delete-instruction danger" data-id="${inst.id}">🗑 Удалить</button>
      </div>
    `;
    list.appendChild(card);
  });
}

// ===== ФОРМА МОДУЛЯ (CREATE / UPDATE) =====
const moduleForm = document.getElementById('moduleForm');
const moduleIdInput = moduleForm.querySelector('input[name="id"]');

moduleForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = moduleIdInput.value.trim();
  const body = {
    code: moduleForm.code.value.trim(),
    name: moduleForm.name.value.trim()
  };

  let url = '/api/modules';
  let method = 'POST';

  if (id) {
    url += `/${id}`;
    method = 'PUT';
  }

  const res = await apiFetch(url, {
    method,
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    alert('Ошибка при сохранении модуля');
    return;
  }

  moduleForm.reset();
  moduleIdInput.value = '';
  await loadModules();
});

// клики по модулям
document.getElementById('modulesList').addEventListener('click', async (e) => {
  const editBtn = e.target.closest('.edit-module');
  const delBtn = e.target.closest('.delete-module');

  if (editBtn) {
    const id = editBtn.dataset.id;
    const res = await apiFetch('/api/modules');
    const modules = await res.json();
    const m = modules.find(x => x.id === id);
    if (!m) return;
    moduleIdInput.value = m.id;
    moduleForm.code.value = m.code;
    moduleForm.name.value = m.name;

    // При редактировании модуля скроллим к форме модулей
    const rect = moduleForm.getBoundingClientRect();
    const targetY = rect.top + window.scrollY - 20;
    window.scrollTo({ top: targetY, behavior: 'smooth' });
  }

  if (delBtn) {
    const id = delBtn.dataset.id;
    if (!confirm('Удалить модуль? Все связанные инструкции нужно удалить вручную.')) return;
    const res = await apiFetch(`/api/modules/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      alert('Ошибка при удалении модуля');
      return;
    }
    await loadModules();
  }
});

// ===== МЕДИА (ЗАГРУЗКА В ФАЙЛЫ) =====
const mediaInput = document.getElementById('mediaFileInput');
const mediaUploadBtn = document.getElementById('mediaUploadBtn');

if (mediaUploadBtn) {
  mediaUploadBtn.addEventListener('click', async () => {
    const file = mediaInput.files[0];
    if (!file) {
      alert('Выберите файл');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);

    const res = await apiFetch('/api/media/upload', {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      alert('Ошибка загрузки файла');
      return;
    }
    const data = await res.json(); // {type, url}
    currentMedia.push(data);
    renderMediaPreview();
    mediaInput.value = '';
  });
}

function renderMediaPreview() {
  const container = document.getElementById('mediaPreview');
  container.innerHTML = '';
  currentMedia.forEach((m, idx) => {
    const wrap = document.createElement('div');
    wrap.style.marginBottom = '8px';
    let inner = '';
    if (m.type === 'image') {
      inner = `<img src="${m.url}" class="media-thumb" />`;
    } else {
      inner = `<video src="${m.url}" controls class="media-thumb"></video>`;
    }
    wrap.innerHTML = inner + `<div><button type="button" data-idx="${idx}" class="secondary remove-media">Удалить</button></div>`;
    container.appendChild(wrap);
  });
}

document.getElementById('mediaPreview').addEventListener('click', (e) => {
  const btn = e.target.closest('.remove-media');
  if (!btn) return;
  const idx = parseInt(btn.dataset.idx, 10);
  currentMedia.splice(idx, 1);
  renderMediaPreview();
});

// ===== ФОРМА ИНСТРУКЦИИ (CREATE / UPDATE) =====
const instructionForm = document.getElementById('instructionForm');
const instructionIdInput = instructionForm.querySelector('input[name="id"]');

instructionForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = instructionIdInput.value.trim();
  const stepsText = instructionForm.steps.value.trim();
  const steps = stepsText ? stepsText.split('\n').map(s => s.trim()).filter(Boolean) : [];

  const body = {
    title: instructionForm.title.value.trim(),
    moduleId: instructionForm.moduleId.value,
    transactionCode: instructionForm.transactionCode.value.trim(),
    steps,
    notes: instructionForm.notes.value.trim(),
    media: currentMedia
  };

  let url = '/api/instructions';
  let method = 'POST';

  if (id) {
    url += `/${id}`;
    method = 'PUT';
  }

  const res = await apiFetch(url, {
    method,
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    alert('Ошибка при сохранении инструкции');
    return;
  }

  instructionForm.reset();
  instructionIdInput.value = '';
  currentMedia = [];
  renderMediaPreview();
  await loadInstructions();

  // после сброса формы пересчитаем высоту текстовых полей
  setupAutoResizeForTextareas();
});

// ===== РЕДАКТИРОВАНИЕ / УДАЛЕНИЕ ИНСТРУКЦИЙ =====
document.getElementById('instructionsList').addEventListener('click', async (e) => {
  const editBtn = e.target.closest('.edit-instruction');
  const delBtn = e.target.closest('.delete-instruction');

  if (editBtn) {
    const id = editBtn.dataset.id;
    const res = await apiFetch(`/api/instructions/${id}`);
    if (!res.ok) {
      alert('Инструкция не найдена');
      return;
    }
    const inst = await res.json();

    instructionIdInput.value = inst.id;
    instructionForm.title.value = inst.title;
    instructionForm.moduleId.value = inst.moduleId;
    instructionForm.transactionCode.value = inst.transactionCode || '';
    instructionForm.notes.value = inst.notes || '';
    instructionForm.steps.value = (inst.steps || []).join('\n');
    currentMedia = inst.media || [];
    renderMediaPreview();

    // После подстановки текста подгоняем высоту textarea под содержимое
    setupAutoResizeForTextareas();

    // Скроллим к форме инструкции
    const formRect = instructionForm.getBoundingClientRect();
    const targetY = formRect.top + window.scrollY - 20;
    window.scrollTo({ top: targetY, behavior: 'smooth' });
  }

  if (delBtn) {
    const id = delBtn.dataset.id;
    if (!confirm('Удалить инструкцию?')) return;
    const res = await apiFetch(`/api/instructions/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      alert('Ошибка при удалении инструкции');
      return;
    }
    await loadInstructions();
  }
});

// ===== INIT =====
(async function init() {
  await loadModules();
  await loadInstructions();
  setupAutoResizeForTextareas();
})();
