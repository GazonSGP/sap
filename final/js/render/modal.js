// render/modal.js — ORIGINAL STRUCTURE + MODULE OUTLINE SAFE

import { state } from '../state/cache.js';
import { escapeHtml } from '../helpers/text.js';
import {
  isImage,
  isVideo,
  fileNameFromUrl
} from '../helpers/mediaDetect.js';
import { openImageLightbox } from '../ui/lightbox.js';

const ICON_BASE_PATH = 'assets/file-icons/';

const EXT_ICON_MAP = {
  pdf: 'pdf.svg',
  doc: 'doc.svg',
  docx: 'doc.svg',
  xls: 'xls.svg',
  xlsx: 'xls.svg',
  zip: 'zip.svg',
  rar: 'rar.svg',
  bpm: 'bpm.svg',
  apk: 'apk.svg'
};

let keyHandler = null;

export function openInstructionModal(inst) {
  const backdrop = document.getElementById('instructionModalBackdrop');
  if (!backdrop) return;

  const moduleObj = state.modules.find(m => m.id === inst.moduleId);
  const moduleColor = moduleObj?.color || '#0a6ed1';

  backdrop.innerHTML = `
    <div class="modal-window" style="--module-color:${moduleColor}">
      <div class="modal-header">
        <div style="display:flex; gap:12px; align-items:center;">
          <div id="modalBadge"></div>
          <h2 id="modalTitle" style="margin:0;font-size:18px;"></h2>
        </div>
        <button id="modalCloseBtn" class="secondary">Закрыть</button>
      </div>

      <div class="modal-left" id="modalLeft">
        <p style="margin:6px 0;font-size:13px;">
          <strong>Транзакция:</strong>
          <span id="modalTransaction"></span>
        </p>
        <div id="modalSteps"></div>
        <div id="modalNotes"></div>
      </div>

      <div class="modal-right" id="modalRight"
           style="display:flex;flex-direction:column;">
        <div id="modalMainMedia" class="modal-main-media"></div>
        <div id="modalFileList"
             style="flex:1 1 auto;overflow:auto;display:flex;flex-direction:column;gap:6px;"></div>
        <div id="modalControls" class="media-controls"
             style="margin-top:auto;"></div>
      </div>
    </div>
  `;

  backdrop.style.display = 'flex';
  document.body.classList.add('modal-open');

  document.getElementById('modalCloseBtn').onclick = closeInstructionModal;
  backdrop.onclick = e => {
    if (e.target === backdrop) closeInstructionModal();
  };

  document.getElementById('modalTitle').textContent =
    inst.title || 'Инструкция';

  document.getElementById('modalTransaction').textContent =
    inst.transactionCode || '-';

  renderBadge(inst);
  renderSteps(inst);
  renderNotes(inst);
  renderMedia(inst);
}

export function closeInstructionModal() {
  const backdrop = document.getElementById('instructionModalBackdrop');
  if (!backdrop) return;

  if (keyHandler) {
    document.removeEventListener('keydown', keyHandler);
    keyHandler = null;
  }

  document.body.classList.remove('modal-open');
  backdrop.style.display = 'none';
  backdrop.innerHTML = '';
}

/* ===== BADGE ===== */
function renderBadge(inst) {
  const el = document.getElementById('modalBadge');
  if (!el) return;

  const moduleObj = state.modules.find(m => m.id === inst.moduleId);
  if (!moduleObj) return;

  el.innerHTML = `
    <span class="fiori-badge">
      <span class="fiori-badge-code"
            style="background:${escapeHtml(moduleObj.color)}">
        ${escapeHtml(moduleObj.code || moduleObj.name[0])}
      </span>
    </span>
  `;
}

/* ===== STEPS ===== */
function renderSteps(inst) {
  const el = document.getElementById('modalSteps');
  if (!inst.steps?.length) {
    el.innerHTML = '<p><em>Шаги не указаны</em></p>';
    return;
  }

  el.innerHTML = `
    <h3>Шаги</h3>
    <div class="steps-block">
      ${inst.steps.map((s,i)=>`
        <div class="step">Шаг ${i+1}: ${escapeHtml(s)}</div>
      `).join('')}
    </div>
  `;
}

/* ===== NOTES ===== */
function renderNotes(inst) {
  const el = document.getElementById('modalNotes');
  el.innerHTML = inst.notes
    ? `<h3>Примечания</h3>
       <div class="modal-notes">${escapeHtml(inst.notes)}</div>`
    : '';
}

/* ===== MEDIA ===== */
function renderMedia(inst) {
  const right = document.getElementById('modalRight');
  const left = document.getElementById('modalLeft');
  const main = document.getElementById('modalMainMedia');
  const list = document.getElementById('modalFileList');
  const controls = document.getElementById('modalControls');

  const media = Array.isArray(inst.media) ? inst.media : [];

  if (!media.length) {
    right.remove();
    left.style.gridColumn = '1 / -1';
    return;
  }

  main.style.height = '360px';
  main.style.minHeight = '360px';

  let index = 0;

  const img = document.createElement('img');
  const video = document.createElement('video');
  const icon = document.createElement('img');

  video.controls = true;
  icon.style.width = '96px';
  icon.style.height = '96px';

  main.append(img, video, icon);

  function getIcon(url) {
    const ext = fileNameFromUrl(url).split('.').pop().toLowerCase();
    return ICON_BASE_PATH + (EXT_ICON_MAP[ext] || 'file.svg');
  }

  function show(i) {
    index = i;
    const m = media[i];

    img.style.display = 'none';
    video.style.display = 'none';
    icon.style.display = 'none';

    if (isImage(m.url)) {
      img.src = m.url;
      img.style.display = 'block';
      img.onclick = () => openImageLightbox(m.url);
    } else if (isVideo(m.url)) {
      video.src = m.url;
      video.style.display = 'block';
    } else {
      icon.src = getIcon(m.url);
      icon.style.display = 'block';
    }

    [...list.children].forEach((el,idx)=>
      el.style.background = idx === i ? '#eef3fb' : ''
    );
  }

  list.innerHTML = '';
  media.forEach((m,i)=>{
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.gap = '8px';
    row.style.padding = '8px 10px';
    row.style.border = '1px solid #c9d1d8';
    row.style.borderRadius = '6px';
    row.style.cursor = 'pointer';
    row.style.fontSize = '13px';

    row.innerHTML = `
      <strong style="min-width:44px;">
        ${fileNameFromUrl(m.url).split('.').pop().toUpperCase()}
      </strong>
      <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
        ${escapeHtml(m.filename || fileNameFromUrl(m.url))}
      </span>
    `;

    row.onclick = () => show(i);
    list.appendChild(row);
  });

  const single = media.length === 1;

  controls.innerHTML = `
    <div style="display:flex;gap:8px;">
      ${single ? '' : '<button class="secondary" id="prevBtn">◀</button>'}
      ${single ? '' : '<button class="secondary" id="nextBtn">▶</button>'}
    </div>
    <button class="secondary" id="downloadBtn">Скачать</button>
  `;

  if (!single) {
    document.getElementById('prevBtn').onclick = () =>
      show((index - 1 + media.length) % media.length);
    document.getElementById('nextBtn').onclick = () =>
      show((index + 1) % media.length);

    keyHandler = e => {
      if (e.key === 'ArrowLeft')
        show((index - 1 + media.length) % media.length);
      if (e.key === 'ArrowRight')
        show((index + 1) % media.length);
    };
    document.addEventListener('keydown', keyHandler);
  }

  document.getElementById('downloadBtn').onclick = () => {
    const m = media[index];
    const a = document.createElement('a');
    a.href = m.url;
    a.download = m.filename || fileNameFromUrl(m.url);
    a.target = '_blank';
    a.click();
  };

  show(0);
}
