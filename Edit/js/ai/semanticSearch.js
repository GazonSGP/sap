// js/ai/semanticSearch.js
import { state } from '../state/cache.js';

/* ================= NORMALIZE ================= */

function normalize(text = '') {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(text) {
  return normalize(text).split(' ').filter(Boolean);
}

/* ================= INDEX ================= */

let index = [];

export function buildSemanticIndex() {
  index = state.instructions.map(inst => {
    const text = `
      ${inst.title || ''}
      ${inst.transactionCode || ''}
      ${(inst.steps || []).join(' ')}
      ${inst.notes || ''}
    `;

    return {
      id: inst.id,
      moduleId: inst.moduleId,
      raw: normalize(text),
      tokens: tokenize(text)
    };
  });
}

/* ================= SEARCH ================= */

export function semanticSearch(query, limit = 20) {
  if (!query || query.length < 2) return [];

  const qTokens = tokenize(query);
  if (!qTokens.length) return [];

  const moduleFilter =
    document.getElementById('moduleFilter')?.value || '';

  /* ===== 1. STRICT SEARCH (точные слова) ===== */

  const strict = index.filter(item => {
    if (moduleFilter && item.moduleId !== moduleFilter) return false;
    return qTokens.every(q => item.raw.includes(q));
  });

  if (strict.length) {
    return strict
      .map(r => state.instructions.find(i => i.id === r.id))
      .slice(0, limit);
  }

  /* ===== 2. SEMANTIC FALLBACK ===== */

  const scored = index
    .filter(item => !moduleFilter || item.moduleId === moduleFilter)
    .map(item => {
      let score = 0;

      qTokens.forEach(q => {
        item.tokens.forEach(t => {
          if (t === q) score += 4;
          else if (t.startsWith(q)) score += 2;
          else if (t.includes(q)) score += 1;
        });
      });

      return { id: item.id, score };
    })
    .filter(r => r.score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map(r =>
    state.instructions.find(i => i.id === r.id)
  );
}
