import { state } from './state/cache.js';
import { loadModulesPublic } from './api/modules.js';
import { loadInstructionsPublic } from './api/instructions.js';
import { syncDock } from './ui/dockController.js';

document.addEventListener('click', e => {
  if (e.target.closest('.open-instruction')) {
    setTimeout(syncDock, 0);
  }
});

import {
  renderInstructionGrid,
  updateActiveBadges
} from './render/grid.js';
import {
  closeInstructionModal
} from './render/modal.js';
import {
  init3DCards,
  init3DToggle
} from './ui/card3d.js';

import {
  buildSemanticIndex,
  semanticSearch
} from './ai/semanticSearch.js';



/* ================= INIT ================= */

(async function init() {
  await loadModulesPublic();
  await loadInstructionsPublic();

  buildSemanticIndex();

  init3DToggle();
  init3DCards();
  updateActiveBadges();
  syncDock();

})();

/* ================= MODULE FILTER ================= */

document.getElementById('moduleFilter')
  ?.addEventListener('change', () => {
    loadInstructionsPublic().then(() => {
      buildSemanticIndex();
      init3DCards();
      updateActiveBadges();
    });
  });

/* ================= GLOBAL SEARCH ================= */

const searchInput = document.getElementById('globalSearch');
let searchTimer = null;

searchInput?.addEventListener('input', e => {
  clearTimeout(searchTimer);

  searchTimer = setTimeout(() => {
    const query = e.target.value.trim();

    if (!query) {
      loadInstructionsPublic().then(() => {
        buildSemanticIndex();
        init3DCards();
        updateActiveBadges();
      });
      return;
    }

    const results = semanticSearch(query);
    renderInstructionGrid(results);
    init3DCards();
    updateActiveBadges();
  }, 250);
});

/* ================= GRID INTERACTIONS ================= */

document.getElementById('instructionsSection')
  ?.addEventListener('click', e => {

    const close = e.target.closest('.badge-close');
    if (close) {
      e.stopPropagation();
      const filter = document.getElementById('moduleFilter');
      filter.value = '';
      loadInstructionsPublic().then(() => {
        buildSemanticIndex();
        init3DCards();
        updateActiveBadges();
      });
      return;
    }

    const badge = e.target.closest('.fiori-badge.clickable');
    if (badge) {
      const moduleId = badge.dataset.moduleId;
      const filter = document.getElementById('moduleFilter');

      if (filter.value === moduleId) return;

      filter.value = moduleId;
      loadInstructionsPublic().then(() => {
        buildSemanticIndex();
        init3DCards();
        updateActiveBadges();
      });
      return;
    }

    const btn = e.target.closest('.open-instruction');
    if (btn) {
      const inst = state.instructions.find(i => i.id === btn.dataset.id);
      if (inst) openInstruction(inst.id);
      return;
    }

    const card = e.target.closest('.instruction-card');
    if (card) {
      const inst = state.instructions.find(i => i.id === card.dataset.id);
      if (inst) openInstruction(inst.id);
    }
  });

/* ================= MODAL CLOSE ================= */

document.getElementById('instructionModalBackdrop')
  ?.addEventListener('click', e => {
    if (e.target.id === 'instructionModalBackdrop') {
      closeInstructionModal();
    }
  });

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeInstructionModal();
  }
});

/* ================= AI ASSISTANT ================= */

const aiToggle   = document.getElementById('aiToggle');
const aiPanel    = document.getElementById('aiPanel');
const aiClose    = document.getElementById('aiClose');
const aiInput    = document.getElementById('aiInput');
const aiSend     = document.getElementById('aiSend');
const aiMessages = document.getElementById('aiMessages');
const aiIcon     = document.querySelector('.ai-helper');
const aiHeader   = document.querySelector('.ai-header');

let aiInitialized = false;

/* ===== Clear button ===== */

const clearBtn = document.createElement('button');
clearBtn.className = 'ai-clear';
clearBtn.textContent = 'Очистить';
clearBtn.style.display = 'none';
aiHeader.appendChild(clearBtn);

clearBtn.onclick = () => {
  aiMessages.innerHTML = '';
  clearBtn.style.display = 'none';
  greetAI();
};

/* ===== AI helpers ===== */

function setAIThinking(state){
  aiIcon?.classList.toggle('ai-thinking', state);
}

function aiAttention(){
  aiIcon?.classList.remove('ai-attention');
  void aiIcon.offsetWidth;
  aiIcon?.classList.add('ai-attention');
}

function greetAI() {
  addAIMessage(
    'Привет! 👋 Я помощник по инструкциям.\n' +
    'Опиши проблему или процесс — я подскажу подходящие инструкции.',
    'bot'
  );
}

function addAIMessage(text, type = 'bot') {
  const div = document.createElement('div');
  div.className = `ai-msg ${type}`;
  div.textContent = text;
  aiMessages.appendChild(div);
  aiMessages.scrollTop = aiMessages.scrollHeight;
}

function addAIResult(inst) {
  const div = document.createElement('div');
  div.className = 'ai-result';
  div.textContent = inst.title || 'Инструкция';
  div.onclick = () => openInstruction(inst.id);
  aiMessages.appendChild(div);
  aiMessages.scrollTop = aiMessages.scrollHeight;
}

/* ===== AI open / close ===== */

aiToggle?.addEventListener('click', () => {
  const opened = aiPanel.style.display === 'flex';
  aiPanel.style.display = opened ? 'none' : 'flex';

  aiIcon?.classList.toggle('paused', !opened);

  if (!aiInitialized) {
    greetAI();
    aiInitialized = true;
  }
});

aiClose?.addEventListener('click', () => {
  aiPanel.style.display = 'none';
  aiIcon?.classList.remove('paused');
});

/* ===== AI query ===== */

function handleAIQuery() {
  const text = aiInput.value.trim();
  if (!text) return;

  clearBtn.style.display = 'inline-flex';

  addAIMessage(text, 'user');
  aiInput.value = '';

  setAIThinking(true);

  setTimeout(() => {
    const results = semanticSearch(text, 5);

    setAIThinking(false);
    aiAttention();

    if (!results.length) {
      addAIMessage(
        'Пока не нашёл подходящих инструкций 🤔',
        'bot'
      );
      return;
    }

    addAIMessage('Вот что может подойти:', 'bot');
    results.forEach(addAIResult);
  }, 400);
}

aiSend?.addEventListener('click', handleAIQuery);
aiInput?.addEventListener('keydown', e => {
  if (e.key === 'Enter') handleAIQuery();
});
