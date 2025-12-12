/* public/js/public.js - облегчённая и исправленная версия
   - карточки компактные по умолчанию (preview)
   - кнопка "Развернуть" внутри карточки раскрывает текст (локально)
   - клик по кнопке "Увидеть больше" или по карточке откроет модалку
   - делегированные события, нет повторных и тяжёлых операций
*/

(() => {
  let modulesCache = [];
  let instructionsCache = [];

  const $ = id => document.getElementById(id);

  function escapeHtml(s){ if (s==null) return ''; return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }
  function fileNameFromUrl(url=''){ try{return decodeURIComponent(url.split('?')[0].split('/').pop());}catch(e){return url.split('/').pop();} }
  function extFromUrl(url=''){ const m = (url||'').split('?')[0].toLowerCase().match(/\.([a-z0-9]+)$/); return m?m[1]:''; }
  const IMAGE_EXTS = ['jpg','jpeg','png','gif','webp','svg','bmp','tiff','ico'];
  const VIDEO_EXTS = ['mp4','webm','ogg','mov','mkv'];
  function isImage(url){ return IMAGE_EXTS.includes(extFromUrl(url)); }
  function isVideo(url){ return VIDEO_EXTS.includes(extFromUrl(url)); }

  function getColorForModule(codeOrName=''){
    const palette = ['#0a6ed1','#0b9f6b','#f97316','#7c3aed','#ef4444','#06b6d4','#f59e0b','#10b981','#6366f1','#db2777'];
    if(!codeOrName) return palette[0];
    let h=0; for(let i=0;i<codeOrName.length;i++){ h = ((h<<5) - h) + codeOrName.charCodeAt(i); h |= 0; }
    return palette[Math.abs(h) % palette.length];
  }

  async function loadModules(){
    try{
      const res = await fetch('/json/modules.json', {cache:'no-store'});
      if(!res.ok) throw new Error('modules fetch ' + res.status);
      modulesCache = await res.json();
    }catch(e){
      console.warn('loadModules error, try root path', e);
      // fallback to root
      try { const fallback = await fetch('/modules.json',{cache:'no-store'}); modulesCache = fallback.ok ? await fallback.json() : []; } catch(_) { modulesCache = []; }
    }
    populateModuleFilter();
  }

  async function loadInstructions(){
    try{
      const res = await fetch('/json/instructions.json', {cache:'no-store'});
      if(!res.ok) throw new Error('instructions fetch ' + res.status);
      instructionsCache = await res.json();
    }catch(e){
      console.warn('loadInstructions error, try root path', e);
      try { const fallback = await fetch('/instructions.json',{cache:'no-store'}); instructionsCache = fallback.ok ? await fallback.json() : []; } catch(_) { instructionsCache = []; }
    }
    applyFilters(); // will call render
  }

  function populateModuleFilter(){
    const sel = $('moduleFilter');
    if(!sel) return;
    const prev = sel.value || '';
    sel.innerHTML = '<option value="">Все модули</option>';
    modulesCache.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = (m.code ? (m.code + ' — ') : '') + (m.name || '');
      sel.appendChild(opt);
    });
    if(prev) sel.value = prev;
  }

  function renderInstructionGrid(list){
    const grid = $('instructionsSection');
    const empty = $('emptyState');
    if(!grid) return;
    grid.innerHTML = '';
    if(!Array.isArray(list) || list.length===0){
      if(empty) empty.style.display = 'block';
      return;
    }
    if(empty) empty.style.display = 'none';

    // Build lightweight cards
    list.forEach(inst => {
      const card = document.createElement('article');
      card.className = 'instruction-card compact';
      card.dataset.id = inst.id || '';

      // meta + badge
      const moduleObj = modulesCache.find(m => m.id === inst.moduleId) || {};
      const color = getColorForModule(moduleObj.code || moduleObj.name || inst.moduleId || '');
      card.style.setProperty('--module-glow', color);

      const metaDiv = document.createElement('div');
      metaDiv.className = 'meta';
      metaDiv.style.display = 'flex';
      metaDiv.style.alignItems = 'center';
      metaDiv.style.gap = '12px';

      const badge = document.createElement('span');
      badge.className = 'fiori-badge clickable';
      badge.dataset.moduleId = inst.moduleId || '';
      const badgeCode = document.createElement('span');
      badgeCode.className = 'fiori-badge-code';
      badgeCode.style.background = color;
      badgeCode.textContent = moduleObj.code || (moduleObj.name ? moduleObj.name[0] : '');
      badge.appendChild(badgeCode);
      metaDiv.appendChild(badge);

      // title
      const h = document.createElement('h3');
      h.textContent = inst.title || '(без названия)';

      // tx
      const tx = document.createElement('p');
      tx.className = 'small';
      tx.innerHTML = `<strong>Транзакция:</strong> ${escapeHtml(inst.transactionCode||'-')}`;

      // content preview
      const content = document.createElement('div');
      content.className = 'card-content';
      // build steps preview (2 lines)
      const stepsArray = Array.isArray(inst.steps) ? inst.steps.slice(0,3) : [];
      const stepsHtml = stepsArray.map((s,i)=>`Шаг ${i+1}: ${escapeHtml(s)}`).join('<br>');
      const notesShort = escapeHtml((inst.notes||'').slice(0,180));
      content.innerHTML = `${stepsHtml ? `<p>${stepsHtml}${(inst.steps && inst.steps.length>3)?'<br>...':''}</p>` : '<p><em>Шаги не указаны</em></p>'}${notesShort?`<p class="small"><strong>Примечания:</strong> ${notesShort}</p>`:''}`;

      // footer
      const footer = document.createElement('div');
      footer.className = 'card-footer';
      const openBtn = document.createElement('button');
      openBtn.className = 'holo-button';
      openBtn.textContent = 'Увидеть больше';
      openBtn.dataset.id = inst.id || '';
      const toggleBtn = document.createElement('button');
      toggleBtn.className = 'card-toggle';
      toggleBtn.textContent = 'Развернуть';
      footer.appendChild(openBtn);
      footer.appendChild(toggleBtn);

      // events: badge click -> filter, openBtn -> modal, toggle -> expand
      badge.addEventListener('click', (e)=>{
        e.stopPropagation();
        const mid = badge.dataset.moduleId || '';
        if(!mid) return;
        $('moduleFilter').value = mid;
        applyFilters();
      });
      openBtn.addEventListener('click', (e)=>{
        e.stopPropagation();
        const id = openBtn.dataset.id;
        const instObj = instructionsCache.find(it => it.id === id);
        if(instObj) openInstructionModal(instObj);
      });
      toggleBtn.addEventListener('click', (e)=>{
        e.stopPropagation();
        const expanded = content.classList.toggle('expanded');
        toggleBtn.textContent = expanded ? 'Свернуть' : 'Развернуть';
      });

      // clicking card opens modal
      card.addEventListener('click', (e)=>{
        // ignore clicks if target was a control (button) - already handled above
        if(e.target.closest('button')) return;
        const instObj = instructionsCache.find(it => it.id === card.dataset.id);
        if(instObj) openInstructionModal(instObj);
      });

      // assemble
      card.appendChild(metaDiv);
      card.appendChild(h);
      card.appendChild(tx);
      card.appendChild(content);
      card.appendChild(footer);
      grid.appendChild(card);
    });

    // after render, no heavy reinit here
  }

  function applyFilters(){
    const q = ($('searchInput')?.value || '').trim().toLowerCase();
    const moduleId = ($('moduleFilter')?.value || '').trim();
    let filtered = instructionsCache.slice();
    if(moduleId) filtered = filtered.filter(i => i.moduleId === moduleId);
    if(q) filtered = filtered.filter(i=>{
      const inTitle = (i.title||'').toLowerCase().includes(q);
      const inTx = (i.transactionCode||'').toLowerCase().includes(q);
      const inNotes = (i.notes||'').toLowerCase().includes(q);
      const inSteps = Array.isArray(i.steps) ? i.steps.join(' ').toLowerCase().includes(q) : false;
      return inTitle || inTx || inNotes || inSteps;
    });
    renderInstructionGrid(filtered);
  }

  /* --------- Modal implementation (robust) --------- */
  function openInstructionModal(inst){
    const backdrop = $('instructionModalBackdrop');
    if(!backdrop) return;
    const modal = backdrop.querySelector('.modal-window');
    modal.innerHTML = `
      <div class="modal-left">
        <div style="display:flex;gap:12px;align-items:center">
          <div id="modalBadge"></div>
          <h2 id="modalTitle"></h2>
        </div>
        <p style="margin:8px 0"><strong>Транзакция:</strong> <span id="modalTx"></span></p>
        <div id="modalSteps"></div>
        <div id="modalNotes" style="margin-top:10px"></div>
      </div>
      <div class="modal-right">
        <div id="modalMainPreview" class="modal-main-media"></div>
        <div id="modalThumbs" class="modal-thumbs"></div>
        <div id="modalControls" class="media-controls"></div>
      </div>
    `;
    // fill
    $('modalTitle').textContent = inst.title || 'Инструкция';
    $('modalTx').textContent = inst.transactionCode || '-';
    const moduleObj = modulesCache.find(m => m.id === inst.moduleId) || {};
    const code = moduleObj.code || (moduleObj.name ? moduleObj.name[0] : '');
    const color = getColorForModule(moduleObj.code || moduleObj.name || inst.moduleId || '');
    $('modalBadge').innerHTML = `<span class="fiori-badge"><span class="fiori-badge-code" style="background:${color}">${escapeHtml(code)}</span></span>`;
    // steps
    if(inst.steps && inst.steps.length){
      $('modalSteps').innerHTML = '<h3>Шаги</h3>' + inst.steps.map((s,i)=>`<div class="step">Шаг ${i+1}: ${escapeHtml(s)}</div>`).join('');
    } else { $('modalSteps').innerHTML = '<p><em>Шаги не указаны</em></p>'; }
    // notes
    if(inst.notes) $('modalNotes').innerHTML = '<h3>Примечания</h3><div class="modal-notes">' + escapeHtml(inst.notes) + '</div>';
    else $('modalNotes').innerHTML = '';
    // media
    const mediaList = Array.isArray(inst.media) ? inst.media.slice() : [];
    const main = $('modalMainPreview'), thumbs = $('modalThumbs'), ctrls = $('modalControls');
    main.innerHTML=''; thumbs.innerHTML=''; ctrls.innerHTML='';
    if(!mediaList.length){
      main.innerHTML = `<div style="padding:20px;color:#94a3b8">Нет медиа</div>`;
    } else {
      // thumbs
      mediaList.forEach((m, idx) => {
        const t = document.createElement('div'); t.className='thumb'; t.dataset.i = idx;
        if((m.type==='image' && isImage(m.url)) || isImage(m.url)){
          const img = document.createElement('img'); img.src = m.url; img.alt = m.filename||fileNameFromUrl(m.url);
          img.style.width='100%'; img.style.height='100%'; img.style.objectFit='cover';
          t.appendChild(img);
        } else if((m.type==='video' && isVideo(m.url)) || isVideo(m.url)){
          const v = document.createElement('video'); v.src = m.url; v.muted=true; v.loop=true; v.autoplay=true; v.style.width='100%'; v.style.height='100%'; t.appendChild(v);
        } else {
          t.innerHTML = `<div style="padding:8px;font-size:13px;color:#0b1220;text-align:center">${escapeHtml(m.filename||fileNameFromUrl(m.url)||'Файл')}</div>`;
        }
        t.addEventListener('click', ()=> renderMain(idx));
        thumbs.appendChild(t);
      });
      let cur = 0;
      function renderMain(i){
        cur = i;
        main.innerHTML = '';
        const m = mediaList[i];
        const url = m.url || '';
        let type = (m.type||'').toLowerCase();
        if(!type){ type = isImage(url)?'image':isVideo(url)?'video':'file'; }
        if(type==='image'){
          const img = document.createElement('img'); img.src = url; img.style.maxWidth='100%'; img.style.maxHeight='100%'; img.addEventListener('click', ()=> openImageLightbox(url));
          main.appendChild(img);
        } else if(type==='video'){
          const video = document.createElement('video'); video.src = url; video.controls=true; main.appendChild(video);
        } else {
          const div = document.createElement('div'); div.className='file-card';
          div.innerHTML = `<div style="display:flex;gap:12px;align-items:center"><div class="icon">FILE</div><div><div style="font-weight:700">${escapeHtml(m.filename||fileNameFromUrl(url)||'Файл')}</div><div class="small">Тип: файл</div></div></div><div><a class="holo-button" href="${url}" download target="_blank">Скачать</a></div>`;
          main.appendChild(div);
        }
        // mark active thumb
        thumbs.querySelectorAll('.thumb').forEach((tt,ii)=> tt.classList.toggle('active', ii===i));
      }
      // controls: prev/next if >1
      if(mediaList.length>1){
        ctrls.innerHTML = `<div style="display:flex;gap:8px"><button class="holo-button modal-prev">◀</button><button class="holo-button modal-next">▶</button></div><div><button class="holo-button modal-download">Скачать всё</button></div>`;
        ctrls.querySelector('.modal-prev').addEventListener('click', ()=> renderMain((cur-1+mediaList.length)%mediaList.length));
        ctrls.querySelector('.modal-next').addEventListener('click', ()=> renderMain((cur+1)%mediaList.length));
        ctrls.querySelector('.modal-download').addEventListener('click', ()=> {
          mediaList.forEach(m=>{ const a=document.createElement('a'); a.href=m.url; a.download=m.filename||fileNameFromUrl(m.url); a.target='_blank'; document.body.appendChild(a); a.click(); a.remove(); });
        });
      }
      renderMain(0);
    }

    // show backdrop
    backdrop.style.display='flex'; setTimeout(()=>backdrop.classList.add('show'),10);

    // close handlers
    function closeAll(){
      backdrop.classList.remove('show'); setTimeout(()=>{ backdrop.style.display='none'; modal.innerHTML=''; },240);
      document.removeEventListener('keydown', onEsc);
    }
    function onEsc(e){ if(e.key==='Escape') closeAll(); }
    document.addEventListener('keydown', onEsc);
    backdrop.addEventListener('click', function onBk(e){ if(e.target===backdrop){ closeAll(); backdrop.removeEventListener('click', onBk); }}, { once:true });
  }

  function openImageLightbox(src){
    const lb = $('imageLightbox'); const img = $('lightboxImg'); if(!lb||!img) return;
    img.src = src; lb.style.display='flex'; setTimeout(()=> lb.classList.add('show'),10);
    lb.addEventListener('click', function onL(e){ if(e.target===lb||e.target===img){ lb.classList.remove('show'); setTimeout(()=>{ lb.style.display='none'; img.src=''; },160); lb.removeEventListener('click', onL); }}, { once:true });
  }

  // init listeners
  function initListeners(){
    $('reloadBtn')?.addEventListener('click', async ()=>{
      $('searchInput') && ($('searchInput').value='');
      $('moduleFilter') && ($('moduleFilter').value='');
      await loadModules(); await loadInstructions();
      const main = document.querySelector('main'); if(main) window.scrollTo({ top: main.getBoundingClientRect().top + window.scrollY - 8, behavior:'smooth' });
    });
    $('searchInput')?.addEventListener('keyup', (e)=>{ if(e.key==='Enter') applyFilters(); });
    $('moduleFilter')?.addEventListener('change', ()=> applyFilters());
  }

  // init
  (async function init(){
    initListeners();
    await loadModules();
    await loadInstructions();
    // open by URL param ?inst=ID
    const params = new URLSearchParams(window.location.search); const instId = params.get('inst');
    if(instId){
      const inst = instructionsCache.find(i=>i.id===instId);
      if(inst) setTimeout(()=> openInstructionModal(inst),300);
    }
  })();

})();
