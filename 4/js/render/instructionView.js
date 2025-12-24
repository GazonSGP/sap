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

export function renderInstructionFull(inst) {
  const module = state.modules.find(m => m.id === inst.moduleId);
  const moduleColor = module?.color || '#0a6ed1';

  return `
    <div class="instruction-full" style="--module-color:${moduleColor}">
      
      <div class="instruction-header">
        <h2>${escapeHtml(inst.title || 'Инструкция')}</h2>
        <p class="instruction-transaction">
          <strong>Транзакция:</strong>
          ${escapeHtml(inst.transactionCode || '-')}
        </p>
      </div>

      <div class="instruction-body">

        <div class="instruction-left">
          ${renderSteps(inst)}
          ${renderNotes(inst)}
        </div>

        <div class="instruction-right">
          ${renderMedia(inst)}
        </div>

      </div>
    </div>
  `;
}

/* ===== STEPS ===== */
function renderSteps(inst) {
  if (!inst.steps?.length) {
    return '<p><em>Шаги не указаны</em></p>';
  }

  return `
    <h3>Шаги</h3>
    <div class="steps-block">
      ${inst.steps.map((s, i) => `
        <div class="step">
          <strong>Шаг ${i + 1}:</strong> ${escapeHtml(s)}
        </div>
      `).join('')}
    </div>
  `;
}

/* ===== NOTES ===== */
function renderNotes(inst) {
  if (!inst.notes) return '';
  return `
    <h3>Примечания</h3>
    <div class="instruction-notes">
      ${escapeHtml(inst.notes)}
    </div>
  `;
}

/* ===== MEDIA ===== */
function renderMedia(inst) {
  const media = Array.isArray(inst.media) ? inst.media : [];
  if (!media.length) return '<p><em>Медиа отсутствуют</em></p>';

  return `
    <h3>Материалы</h3>
    <div class="media-list">
      ${media.map(m => renderMediaItem(m)).join('')}
    </div>
  `;
}

function renderMediaItem(m) {
  const ext = fileNameFromUrl(m.url).split('.').pop().toLowerCase();
  const icon = EXT_ICON_MAP[ext] || 'file.svg';

  if (isImage(m.url)) {
    return `
      <img class="media-thumb"
           src="${m.url}"
           alt=""
           onclick="window.__openLightbox('${m.url}')"/>
    `;
  }

  return `
    <div class="media-file"
         onclick="window.open('${m.url}','_blank')">
      <img src="${ICON_BASE_PATH + icon}" />
      <span>${escapeHtml(m.filename || fileNameFromUrl(m.url))}</span>
    </div>
  `;
}

/* ===== GLOBAL BIND ===== */
window.__openLightbox = openImageLightbox;
