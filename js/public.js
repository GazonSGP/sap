/* public/js/public.js
   Aurora 2040 — public logic
   - Loads data from /data/modules.json and /data/instructions.json
   - Renders Holo cards (.instruction-card)
   - Badge filtering, search, reload
   - Two-column modal (text left, media right)
   - Lightbox for images
   - Media types: image | video | file (downloadable)
*/

(() => {
  // Caches
  let modulesCache = [];
  let instructionsCache = [];

  // Helpers
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function fileNameFromUrl(url = '') {
    try {
      return decodeURIComponent(url.split('?')[0].split('/').pop());
    } catch (e) { return url.split('/').pop(); }
  }

  const IMAGE_EXTS = ['jpg','jpeg','png','gif','webp','svg','bmp','tiff','ico'];
  const VIDEO_EXTS = ['mp4','webm','ogg','mov','mkv'];

  function extFromUrl(url = '') {
    const u = (url || '').split('?')[0];
    const m = u.toLowerCase().match(/\.([a-z0-9]+)$/);
    return m ? m[1] : '';
  }
  function isImageUrl(url) { return IMAGE_EXTS.includes(extFromUrl(url)); }
  function isVideoUrl(url) { return VIDEO_EXTS.includes(extFromUrl(url)); }

  function cropText(text = '', max = 180) {
    if (!text) return '';
    return text.length <= max ? text : text.slice(0, max) + '...';
  }

  // Basic deterministic color-picker based on module code/name
  function getColorForModule(codeOrName = '') {
    const palette = [
      '#0a6ed1', '#0b9f6b', '#f97316', '#7c3aed', '#ef4444',
      '#06b6d4', '#f59e0b', '#10b981', '#6366f1', '#db2777',
      '#ff6b6b', '#00bcd4', '#ff8a65'
    ];
    if (!codeOrName) return palette[0];
    let h = 0;
    for (let i = 0; i < codeOrName.length; i++) {
      h = ((h << 5) - h) + codeOrName.charCodeAt(i);
      h |= 0;
    }
    return palette[Math.abs(h) % palette.length];
  }

  // DOM shortcuts
  const $ = id => document.getElementById(id);

  // Load modules
  async function loadModules() {
    try {
      const res = await fetch('data/modules.json', { cache: 'no-store' });
      modulesCache = await res.json();
    } catch (e) {
      console.error('loadModules error', e);
      modulesCache = [];
    }
    populateModuleFilter();
  }

  function populateModuleFilter() {
    const sel = $('moduleFilter');
    if (!sel) return;
    const prev = sel.value || '';
    sel.innerHTML = '<option value="">Все модули</option>';
    modulesCache.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = (m.code ? (m.code + ' — ') : '') + (m.name || '');
      sel.appendChild(opt);
    });
    if (prev) sel.value = prev;
    updateBadgeColors();
  }

  // Load instructions
  async function loadInstructions() {
    try {
      const res = await fetch('/data/instructions.json', { cache: 'no-store' });
      instructionsCache = await res.json();
    } catch (e) {
      console.error('loadInstructions error', e);
      instructionsCache = [];
    }
    renderInstructionGrid(instructionsCache);
  }

  // Render grid
  function renderInstructionGrid(listData) {
    const grid = $('instructionsSection');
    const empty = $('emptyState');
    if (!grid) return;
    grid.innerHTML = '';

    const items = Array.isArray(listData) ? listData : [];
    if (!items.length) {
      if (empty) empty.style.display = 'block';
      return;
    }
    if (empty) empty.style.display = 'none';

    items.forEach(inst => {
      const card = document.createElement('article');
      card.className = 'instruction-card';
      card.tabIndex = 0;
      card.dataset.id = inst.id || '';

      // module info
      const moduleObj = modulesCache.find(m => m.id === inst.moduleId) || null;
      const moduleCode = moduleObj && moduleObj.code ? moduleObj.code : '';
      const moduleName = moduleObj && moduleObj.name ? moduleObj.name : (inst.moduleId || '');
      const color = getColorForModule(moduleCode || moduleName);

      // set per-card module glow var (used in CSS)
      card.style.setProperty('--module-glow', color);

      // badge
      const badge = document.createElement('div');
      badge.className = 'fiori-badge clickable';
      badge.dataset.moduleId = inst.moduleId || '';
      badge.title = moduleName || '';
      const badgeCode = document.createElement('span');
      badgeCode.className = 'fiori-badge-code';
      badgeCode.style.background = color;
      badgeCode.textContent = moduleCode || (moduleName ? moduleName[0] : '');
      badge.appendChild(badgeCode);

      // title
      const title = document.createElement('h3');
      title.innerHTML = escapeHtml(inst.title || '(без названия)');

      // transaction row
      const tx = document.createElement('p');
      tx.className = 'small';
      tx.innerHTML = `<strong>Транзакция:</strong> ${escapeHtml(inst.transactionCode || '-')}`;

      // steps preview (first 2-3)
      const steps = (inst.steps || []).slice(0, 3).map((s, idx) => `Шаг ${idx+1}: ${escapeHtml(s)}`).join('<br>');
      const more = (inst.steps || []).length > 3 ? '<br>...' : '';

      const content = document.createElement('div');
      content.className = 'card-content';
      content.innerHTML = `${steps ? `<p>${steps}${more}</p>` : '<p><em>Шаги не указаны</em></p>'}${inst.notes ? `<p class="small"><strong>Примечания:</strong> ${escapeHtml(cropText(inst.notes, 160))}</p>` : ''}`;

      // footer with button
      const footer = document.createElement('div');
      footer.className = 'card-footer';
      footer.style.marginTop = '12px';
      const btn = document.createElement('button');
      btn.className = 'holo-button';
      btn.textContent = 'Увидеть больше';
      btn.dataset.id = inst.id || '';
      footer.appendChild(btn);

      // assemble
      const metaWrap = document.createElement('div');
      metaWrap.className = 'meta';
      metaWrap.style.display = 'flex';
      metaWrap.style.alignItems = 'center';
      metaWrap.style.gap = '12px';
      metaWrap.appendChild(badge);
      // append
      card.appendChild(metaWrap);
      card.appendChild(title);
      card.appendChild(tx);
      card.appendChild(content);
      card.appendChild(footer);

      // events
      badge.addEventListener('click', (e) => {
        e.stopPropagation();
        const mid = badge.dataset.moduleId || '';
        if (!mid) return;
        $('moduleFilter').value = mid;
        applyFilters();
      });

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const instObj = instructionsCache.find(x => x.id === id);
        if (instObj) openInstructionModal(instObj);
      });

      card.addEventListener('click', (e) => {
        const instObj = instructionsCache.find(x => x.id === card.dataset.id);
        if (instObj) openInstructionModal(instObj);
      });

      grid.appendChild(card);
    });

    // re-init enhancement hooks (parallax, pulses) — UI enhancement script can also hook into DOM
    if (window.__uiEnhanceReinit) window.__uiEnhanceReinit();
  }

  // Apply search + module filter
  function applyFilters() {
    const q = ($('searchInput')?.value || '').trim().toLowerCase();
    const moduleId = ($('moduleFilter')?.value || '').trim();
    let filtered = instructionsCache.slice();

    if (moduleId) filtered = filtered.filter(i => i.moduleId === moduleId);
    if (q) filtered = filtered.filter(i => {
      const inTitle = (i.title || '').toLowerCase().includes(q);
      const inTx = (i.transactionCode || '').toLowerCase().includes(q);
      const inNotes = (i.notes || '').toLowerCase().includes(q);
      const inSteps = (Array.isArray(i.steps) ? i.steps.join(' ') : '').toLowerCase().includes(q);
      return inTitle || inTx || inNotes || inSteps;
    });

    renderInstructionGrid(filtered);
    updateActiveBadges();
  }

  function updateActiveBadges() {
    const activeModule = ($('moduleFilter')?.value || '');
    document.querySelectorAll('.fiori-badge').forEach(b => {
      const mid = b.dataset.moduleId || '';
      b.classList.toggle('active', activeModule && (mid === activeModule));
    });
  }

  // ------------------ MODAL ------------------
  function openInstructionModal(inst) {
    const backdrop = $('instructionModalBackdrop');
    if (!backdrop) return;
    const modal = backdrop.querySelector('.modal-window');
    if (!modal) return;

    // Compose modal content (left text, right media)
    modal.innerHTML = `
      <div class="modal-left" role="document" tabindex="0">
        <div style="display:flex;gap:12px;align-items:center;margin-bottom:8px">
          <div id="modalBadge"></div>
          <h2 id="modalTitle" style="margin:0;font-size:18px"></h2>
        </div>
        <p style="margin:6px 0 12px 0;"><strong>Транзакция:</strong> <span id="modalTx"></span></p>
        <div id="modalSteps"></div>
        <div id="modalNotes" style="margin-top:10px"></div>
      </div>
      <div class="modal-right" aria-hidden="false">
        <div id="modalMediaArea">
          <div class="modal-main-media" id="modalMainPreview"></div>
          <div class="modal-thumbs" id="modalThumbs"></div>
          <div class="media-controls" id="modalControls"></div>
        </div>
      </div>
    `;

    // fill textual
    $('modalTitle').textContent = inst.title || 'Инструкция';
    $('modalTx').textContent = inst.transactionCode || '-';

    // badge
    const moduleObj = modulesCache.find(m => m.id === inst.moduleId) || null;
    const code = moduleObj && moduleObj.code ? moduleObj.code : '';
    const name = moduleObj && moduleObj.name ? moduleObj.name : (inst.moduleId || '');
    const color = getColorForModule(code || name);
    $('modalBadge').innerHTML = `<span class="fiori-badge"><span class="fiori-badge-code" style="background:${color}">${escapeHtml(code || (name?name[0]:''))}</span></span>`;

    // steps
    if (inst.steps && inst.steps.length) {
      const stepsHtml = inst.steps.map((s, idx) => `<div class="step">Шаг ${idx+1}: ${escapeHtml(s)}</div>`).join('');
      $('modalSteps').innerHTML = `<h3>Шаги</h3><div class="steps-block">${stepsHtml}</div>`;
    } else {
      $('modalSteps').innerHTML = '<p><em>Шаги не указаны</em></p>';
    }

    // notes
    if (inst.notes) {
      $('modalNotes').innerHTML = `<h3>Примечания</h3><div class="modal-notes">${escapeHtml(inst.notes)}</div>`;
    } else {
      $('modalNotes').innerHTML = '';
    }

    // media
    const mediaList = Array.isArray(inst.media) ? inst.media.slice() : [];
    const mainPreview = $('modalMainPreview');
    const thumbs = $('modalThumbs');
    const controls = $('modalControls');

    mainPreview.innerHTML = '';
    thumbs.innerHTML = '';
    controls.innerHTML = '';

    if (!mediaList.length) {
      mainPreview.innerHTML = `<div style="padding:20px;color:#94a3b8">Нет медиа</div>`;
      controls.classList.add('hidden');
    } else {
      // prepare thumbs
      mediaList.forEach((m, idx) => {
        const t = document.createElement('div');
        t.className = 'thumb';
        t.dataset.index = idx;
        // decide thumb content
        if ((m.type === 'image' && isImageUrl(m.url)) || isImageUrl(m.url)) {
          const img = document.createElement('img');
          img.src = m.url;
          img.alt = m.filename || fileNameFromUrl(m.url);
          img.style.width = '100%';
          img.style.height = '100%';
          img.style.objectFit = 'cover';
          img.addEventListener('error', () => {
            t.innerHTML = `<div class="small">${escapeHtml(m.filename || fileNameFromUrl(m.url) || 'Файл')}</div>`;
          });
          t.appendChild(img);
        } else if ((m.type === 'video' && isVideoUrl(m.url)) || isVideoUrl(m.url)) {
          const vid = document.createElement('video');
          vid.src = m.url;
          vid.muted = true; vid.loop = true; vid.autoplay = true;
          vid.style.width = '100%'; vid.style.height = '100%'; vid.style.objectFit = 'cover';
          t.appendChild(vid);
        } else {
          t.innerHTML = `<div style="padding:8px;text-align:center;font-size:13px;color:#0b1220">${escapeHtml(m.filename || fileNameFromUrl(m.url) || 'Файл')}</div>`;
        }
        t.addEventListener('click', () => renderMain(idx));
        thumbs.appendChild(t);
      });

      let currentIndex = 0;
      function renderMain(i) {
        currentIndex = i;
        mainPreview.innerHTML = '';
        const m = mediaList[i];
        if (!m) return;
        const url = m.url || '';
        // determine type robustly
        let type = (m.type || '').toLowerCase();
        if (!type) {
          if (isImageUrl(url)) type = 'image';
          else if (isVideoUrl(url)) type = 'video';
          else type = 'file';
        } else {
          // sanity: if declared image but extension not image -> fallback to file
          if (type === 'image' && !isImageUrl(url)) type = 'file';
          if (type === 'video' && !isVideoUrl(url)) type = 'file';
        }

        if (type === 'image') {
          const img = document.createElement('img');
          img.src = url;
          img.alt = m.filename || fileNameFromUrl(url);
          img.style.maxWidth = '100%';
          img.style.maxHeight = '100%';
          img.addEventListener('click', () => openImageLightbox(url));
          img.addEventListener('error', () => {
            mainPreview.innerHTML = `<div style="padding:16px;color:#b91c1c">Не удалось загрузить изображение</div>`;
          });
          mainPreview.appendChild(img);
        } else if (type === 'video') {
          const video = document.createElement('video');
          video.src = url;
          video.controls = true;
          video.style.maxHeight = '100%';
          video.addEventListener('error', () => {
            mainPreview.innerHTML = `<div style="padding:16px;color:#b91c1c">Не удалось загрузить видео</div>`;
          });
          mainPreview.appendChild(video);
        } else {
          // file fallback card with download
          const wrap = document.createElement('div');
          wrap.className = 'file-card';
          wrap.style.display = 'flex';
          wrap.style.alignItems = 'center';
          wrap.style.justifyContent = 'space-between';
          wrap.innerHTML = `
            <div style="display:flex;gap:12px;align-items:center;">
              <div class="icon" style="width:56px;height:56px;border-radius:10px;background:linear-gradient(180deg,#f8fafc,#eef2ff);display:flex;align-items:center;justify-content:center;color:#0b1220;font-weight:700">FILE</div>
              <div>
                <div style="font-weight:700">${escapeHtml(m.filename || fileNameFromUrl(url) || 'Файл')}</div>
                <div class="small" style="color:#64748b;margin-top:6px">Тип: файл</div>
              </div>
            </div>
            <div><a class="holo-button" href="${url}" download target="_blank">Скачать</a></div>
          `;
          mainPreview.appendChild(wrap);
        }

        // mark active thumb
        thumbs.querySelectorAll('.thumb').forEach((t, idx) => t.classList.toggle('active', idx === i));
      }

      // controls (prev/next/download)
      if (mediaList.length > 1) {
        controls.classList.remove('hidden');
        controls.innerHTML = `
          <div style="display:flex;gap:8px">
            <button class="holo-button modal-prev">◀</button>
            <button class="holo-button modal-next">▶</button>
          </div>
          <div style="display:flex;gap:8px">
            <button class="holo-button modal-download">Скачать всё</button>
          </div>
        `;
        controls.querySelector('.modal-prev').addEventListener('click', () => {
          renderMain((currentIndex - 1 + mediaList.length) % mediaList.length);
        });
        controls.querySelector('.modal-next').addEventListener('click', () => {
          renderMain((currentIndex + 1) % mediaList.length);
        });
        controls.querySelector('.modal-download').addEventListener('click', () => {
          mediaList.forEach(m => {
            const a = document.createElement('a');
            a.href = m.url;
            a.download = m.filename || fileNameFromUrl(m.url);
            a.target = '_blank';
            document.body.appendChild(a);
            a.click();
            a.remove();
          });
        });
      } else {
        controls.classList.add('hidden');
        // single download button
        const dlWrap = document.createElement('div');
        dlWrap.style.display = 'flex';
        dlWrap.style.justifyContent = 'flex-end';
        dlWrap.style.marginTop = '8px';
        const btn = document.createElement('button');
        btn.className = 'holo-button';
        btn.textContent = 'Скачать';
        btn.addEventListener('click', () => {
          const m = mediaList[0];
          const a = document.createElement('a');
          a.href = m.url;
          a.download = m.filename || fileNameFromUrl(m.url);
          a.target = '_blank';
          document.body.appendChild(a);
          a.click();
          a.remove();
        });
        dlWrap.appendChild(btn);
        $('modalMediaArea').appendChild(dlWrap);
      }

      // initial render
      renderMain(0);
    }

    // show backdrop
    backdrop.style.display = 'flex';
    // small delay then add class (CSS animations)
    setTimeout(() => backdrop.classList.add('show'), 10);

    // close on backdrop click
    backdrop.addEventListener('click', function onBk(e) {
      if (e.target === backdrop) {
        backdrop.classList.remove('show');
        setTimeout(() => { backdrop.style.display = 'none'; modal.innerHTML = ''; backdrop.removeEventListener('click', onBk); }, 260);
      }
    }, { once: true });

    // Esc key handler
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        backdrop.classList.remove('show');
        setTimeout(() => { backdrop.style.display = 'none'; modal.innerHTML = ''; document.removeEventListener('keydown', escHandler); }, 260);
      }
    };
    document.addEventListener('keydown', escHandler);
  }

  // Lightbox
  function openImageLightbox(src) {
    const lb = $('imageLightbox');
    const img = $('lightboxImg');
    if (!lb || !img) return;
    img.src = src;
    lb.style.display = 'flex';
    setTimeout(()=> lb.classList.add('show'), 10);
    // close click
    lb.addEventListener('click', function onL(e) {
      if (e.target === lb || e.target === img) {
        lb.classList.remove('show');
        setTimeout(()=> { lb.style.display='none'; img.src=''; lb.removeEventListener('click', onL); }, 160);
      }
    }, { once: true });
  }

  // Update badges colors (global)
  function updateBadgeColors() {
    document.querySelectorAll('.fiori-badge .fiori-badge-code').forEach(el => {
      // already set via inline style when rendering card; nothing to do
    });
  }

  // Initialization + listeners
  function initListeners() {
    $('reloadBtn')?.addEventListener('click', async () => {
      $('searchInput') && ( $('searchInput').value = '' );
      $('moduleFilter') && ( $('moduleFilter').value = '' );
      await loadModules();
      await loadInstructions();
      // scroll to top
      const main = document.querySelector('main');
      if (main) window.scrollTo({ top: main.getBoundingClientRect().top + window.scrollY - 8, behavior: 'smooth' });
    });

    $('searchInput')?.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') applyFilters();
    });

    $('moduleFilter')?.addEventListener('change', () => {
      applyFilters();
      updateActiveBadges();
    });

    // card open by click delegated
    document.getElementById('instructionsSection')?.addEventListener('click', (e) => {
      const card = e.target.closest('.instruction-card');
      if (!card) return;
      const id = card.dataset.id;
      const inst = instructionsCache.find(i => i.id === id);
      if (inst) openInstructionModal(inst);
    });
  }

  // On load: fetch, render, handle inst param
  (async function init() {
    await loadModules();
    await loadInstructions();

    // if URL has ?inst=ID open that one
    const params = new URLSearchParams(window.location.search);
    const instId = params.get('inst');
    if (instId) {
      const inst = instructionsCache.find(i => i.id === instId);
      if (inst) setTimeout(()=> openInstructionModal(inst), 300);
    }
  })();

  // Attach public API for ui-enhancements (optional)
  window.__uiEnhanceReinit = () => {
    // used by ui-enhancements to re-init animations
    // e.g. parallax scripts can call this after re-render
    // currently no-op, but available
  };

  initListeners();

})();

