/* public/js/public.js - stable loader with fallback paths */
(() => {
  let modulesCache = [], instructionsCache = [];
  const $ = id => document.getElementById(id);
  function escapeHtml(s){ if(s==null) return ''; return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;'); }
  function fileNameFromUrl(u){ try{return decodeURIComponent((u||'').split('?')[0].split('/').pop()); }catch(e){ return (u||'').split('/').pop(); }
  }
  function extFromUrl(u){ const m=(u||'').split('?')[0].toLowerCase().match(/\.([a-z0-9]+)$/); return m?m[1]:''; }
  const IMG = ['jpg','jpeg','png','gif','webp','svg','bmp','tiff','ico'], VID=['mp4','webm','ogg','mov','mkv'];
  function isImage(u){ return IMG.includes(extFromUrl(u)); } function isVideo(u){ return VID.includes(extFromUrl(u)); }
  function getColorForModule(name){ const p=['#0a6ed1','#0b9f6b','#f97316','#7c3aed','#ef4444','#06b6d4','#f59e0b','#10b981','#6366f1','#db2777']; if(!name) return p[0]; let h=0; for(let i=0;i<name.length;i++){ h=((h<<5)-h)+name.charCodeAt(i); h|=0; } return p[Math.abs(h)%p.length]; }

  async function fetchJsonWithFallback(paths){
    for(const p of paths){
      try{
        const r = await fetch(p,{cache:'no-store'});
        if(!r.ok) continue;
        return await r.json();
      }catch(e){ continue; }
    }
    return null;
  }

  async function loadModules(){
    const res = await fetchJsonWithFallback(['/data/modules.json','/json/modules.json','/modules.json']);
    modulesCache = Array.isArray(res)?res:[];
    populateModuleFilter();
  }

  async function loadInstructions(){
    const res = await fetchJsonWithFallback(['/data/instructions.json','/json/instructions.json','/instructions.json']);
    instructionsCache = Array.isArray(res)?res:[];
    applyFilters();
  }

  function populateModuleFilter(){
    const sel = $('moduleFilter'); if(!sel) return;
    const prev = sel.value||''; sel.innerHTML = '<option value="">Все модули</option>';
    modulesCache.forEach(m=>{ const o=document.createElement('option'); o.value=m.id; o.textContent=(m.code?m.code+' — ':'')+(m.name||''); sel.appendChild(o); });
    if(prev) sel.value = prev;
  }

  function renderInstructionGrid(list){
    const grid = $('instructionsSection'), empty=$('emptyState'); if(!grid) return; grid.innerHTML='';
    if(!Array.isArray(list)||!list.length){ if(empty) empty.style.display='block'; return; } if(empty) empty.style.display='none';
    list.forEach(inst=>{
      const card=document.createElement('article'); card.className='instruction-card compact'; card.dataset.id=inst.id||'';
      const moduleObj = modulesCache.find(m=>m.id===inst.moduleId) || {};
      const color = getColorForModule(moduleObj.code||moduleObj.name||inst.moduleId||'');
      card.style.setProperty('--module-glow', color);

      const meta = document.createElement('div'); meta.className='meta'; meta.style.display='flex'; meta.style.gap='10px';
      const badge=document.createElement('span'); badge.className='fiori-badge clickable'; badge.dataset.moduleId=inst.moduleId||''; const bc=document.createElement('span'); bc.className='fiori-badge-code'; bc.style.background=color; bc.textContent = moduleObj.code || (moduleObj.name?moduleObj.name[0]:''); badge.appendChild(bc); meta.appendChild(badge);

      const h=document.createElement('h3'); h.textContent = inst.title || '(без названия)';
      const tx=document.createElement('p'); tx.className='small'; tx.innerHTML = '<strong>Транзакция:</strong> '+escapeHtml(inst.transactionCode||'-');

      const content=document.createElement('div'); content.className='card-content';
      const steps = (Array.isArray(inst.steps)?inst.steps.slice(0,3):[]).map((s,i)=>`Шаг ${i+1}: ${escapeHtml(s)}`).join('<br>');
      const notesShort = escapeHtml((inst.notes||'').slice(0,160));
      content.innerHTML = (steps?`<p>${steps}${(inst.steps&&inst.steps.length>3?'<br>...':'')}</p>`:'<p><em>Шаги не указаны</em></p>') + (notesShort?`<p class="small"><strong>Примечания:</strong> ${notesShort}</p>`:'');

      const footer = document.createElement('div'); footer.className='card-footer';
      const openBtn = document.createElement('button'); openBtn.className='holo-button'; openBtn.textContent='Увидеть больше'; openBtn.dataset.id = inst.id||'';
      const toggleBtn = document.createElement('button'); toggleBtn.className='card-toggle'; toggleBtn.textContent='Развернуть';
      footer.appendChild(openBtn); footer.appendChild(toggleBtn);

      badge.addEventListener('click', (e)=>{ e.stopPropagation(); const mid=badge.dataset.moduleId||''; if(!mid) return; $('moduleFilter').value=mid; applyFilters(); });
      openBtn.addEventListener('click',(e)=>{ e.stopPropagation(); const id=openBtn.dataset.id; const instObj = instructionsCache.find(x=>x.id===id); if(instObj) openInstructionModal(instObj); });
      toggleBtn.addEventListener('click',(e)=>{ e.stopPropagation(); const expanded = content.classList.toggle('expanded'); toggleBtn.textContent = expanded ? 'Свернуть' : 'Развернуть'; });

      card.addEventListener('click',(e)=>{ if(e.target.closest('button')) return; const instObj = instructionsCache.find(x=>x.id===card.dataset.id); if(instObj) openInstructionModal(instObj); });

      card.appendChild(meta); card.appendChild(h); card.appendChild(tx); card.appendChild(content); card.appendChild(footer);
      grid.appendChild(card);
    });
  }

  function applyFilters(){
    const q = ($('searchInput')?.value||'').trim().toLowerCase(); const moduleId = ($('moduleFilter')?.value||'').trim();
    let filtered = instructionsCache.slice();
    if(moduleId) filtered = filtered.filter(i=>i.moduleId===moduleId);
    if(q) filtered = filtered.filter(i=>{ const t=(i.title||'').toLowerCase(), tx=(i.transactionCode||'').toLowerCase(), n=(i.notes||'').toLowerCase(); const s = Array.isArray(i.steps)?i.steps.join(' ').toLowerCase():''; return t.includes(q)||tx.includes(q)||n.includes(q)||s.includes(q);});
    renderInstructionGrid(filtered);
  }

  function openInstructionModal(inst){
    const backdrop = $('instructionModalBackdrop'); if(!backdrop) return; const modal = backdrop.querySelector('.modal-window'); modal.innerHTML='';
    modal.innerHTML = `<div class="modal-left"><div style="display:flex;gap:12px;align-items:center"><div id="modalBadge"></div><h2 id="modalTitle"></h2></div><p style="margin:8px 0"><strong>Транзакция:</strong> <span id="modalTx"></span></p><div id="modalSteps"></div><div id="modalNotes" style="margin-top:10px"></div></div><div class="modal-right"><div id="modalMainPreview" class="modal-main-media"></div><div id="modalThumbs" class="modal-thumbs"></div><div id="modalControls" class="media-controls"></div></div>`;
    $('modalTitle').textContent = inst.title||'Инструкция'; $('modalTx').textContent = inst.transactionCode||'-';
    const moduleObj = modulesCache.find(m=>m.id===inst.moduleId)||{}; const code=moduleObj.code||(moduleObj.name?moduleObj.name[0]:''); const color=getColorForModule(moduleObj.code||moduleObj.name||inst.moduleId||'');
    $('modalBadge').innerHTML = `<span class="fiori-badge"><span class="fiori-badge-code" style="background:${color}">${escapeHtml(code)}</span></span>`;
    if(inst.steps&&inst.steps.length) $('modalSteps').innerHTML = '<h3>Шаги</h3>' + inst.steps.map((s,i)=>`<div class="step">Шаг ${i+1}: ${escapeHtml(s)}</div>`).join(''); else $('modalSteps').innerHTML = '<p><em>Шаги не указаны</em></p>';
    $('modalNotes').innerHTML = inst.notes?'<h3>Примечания</h3><div class="modal-notes">'+escapeHtml(inst.notes)+'</div>':'';
    const mediaList = Array.isArray(inst.media)?inst.media.slice():[]; const main = $('modalMainPreview'), thumbs = $('modalThumbs'), ctrls = $('modalControls'); main.innerHTML=''; thumbs.innerHTML=''; ctrls.innerHTML='';
    if(!mediaList.length){ main.innerHTML = `<div style="padding:20px;color:${'#94a3b8'}">Нет медиа</div>`; } else {
      mediaList.forEach((m,idx)=>{ const t=document.createElement('div'); t.className='thumb'; t.dataset.i=idx;
        if((m.type==='image' && isImage(m.url)) || isImage(m.url)){ const img=document.createElement('img'); img.src=m.url; img.alt=m.filename||fileNameFromUrl(m.url); img.style.width='100%'; img.style.height='100%'; img.style.objectFit='cover'; t.appendChild(img); }
        else if((m.type==='video' && isVideo(m.url)) || isVideo(m.url)){ const v=document.createElement('video'); v.src=m.url; v.muted=true; v.loop=true; v.autoplay=true; v.style.width='100%'; v.style.height='100%'; t.appendChild(v); }
        else { t.innerHTML = `<div style="padding:8px;font-size:13px;color:#0b1220;text-align:center">${escapeHtml(m.filename||fileNameFromUrl(m.url)||'Файл')}</div>`; }
        t.addEventListener('click',()=>renderMain(idx)); thumbs.appendChild(t);
      });
      let cur=0;
      function renderMain(i){ cur=i; main.innerHTML=''; const m=mediaList[i]; const url=m.url||''; let type=(m.type||'').toLowerCase(); if(!type) type = isImage(url)?'image':isVideo(url)?'video':'file'; if(type==='image'){ const img=document.createElement('img'); img.src=url; img.style.maxWidth='100%'; img.style.maxHeight='100%'; img.addEventListener('click',()=>openImageLightbox(url)); main.appendChild(img); }
        else if(type==='video'){ const video=document.createElement('video'); video.src=url; video.controls=true; main.appendChild(video); }
        else { const div=document.createElement('div'); div.className='file-card'; div.innerHTML = `<div style="display:flex;gap:12px;align-items:center"><div class="icon">FILE</div><div><div style="font-weight:700">${escapeHtml(m.filename||fileNameFromUrl(url)||'Файл')}</div><div class="small">Тип: файл</div></div></div><div><a class="holo-button" href="${url}" download target="_blank">Скачать</a></div>`; main.appendChild(div); }
        thumbs.querySelectorAll('.thumb').forEach((tt,ii)=>tt.classList.toggle('active',ii===i));
      }
      if(mediaList.length>1){ ctrls.innerHTML = `<div style="display:flex;gap:8px"><button class="holo-button modal-prev">◀</button><button class="holo-button modal-next">▶</button></div><div><button class="holo-button modal-download">Скачать всё</button></div>`; ctrls.querySelector('.modal-prev').addEventListener('click',()=>renderMain((cur-1+mediaList.length)%mediaList.length)); ctrls.querySelector('.modal-next').addEventListener('click',()=>renderMain((cur+1)%mediaList.length)); ctrls.querySelector('.modal-download').addEventListener('click',()=>{ mediaList.forEach(m=>{ const a=document.createElement('a'); a.href=m.url; a.download=m.filename||fileNameFromUrl(m.url); a.target='_blank'; document.body.appendChild(a); a.click(); a.remove(); }); }); } renderMain(0);
    }
    backdrop.style.display='flex'; setTimeout(()=>backdrop.classList.add('show'),10);
    function closeAll(){ backdrop.classList.remove('show'); setTimeout(()=>{ backdrop.style.display='none'; modal.innerHTML=''; },240); document.removeEventListener('keydown', onEsc); }
    function onEsc(e){ if(e.key==='Escape') closeAll(); }
    document.addEventListener('keydown', onEsc);
    backdrop.addEventListener('click', function onBk(e){ if(e.target===backdrop){ closeAll(); backdrop.removeEventListener('click', onBk); } }, { once:true });
  }

  function openImageLightbox(src){ const lb=$('imageLightbox'), img=$('lightboxImg'); if(!lb||!img) return; img.src=src; lb.style.display='flex'; setTimeout(()=>lb.classList.add('show'),10); lb.addEventListener('click', function onL(e){ if(e.target===lb||e.target===img){ lb.classList.remove('show'); setTimeout(()=>{ lb.style.display='none'; img.src=''; },160); lb.removeEventListener('click', onL); } }, { once:true }); }

  function initListeners(){ $('reloadBtn')?.addEventListener('click', async ()=>{ $('searchInput') && ($('searchInput').value=''); $('moduleFilter') && ($('moduleFilter').value=''); await loadModules(); await loadInstructions(); const m=document.querySelector('main'); if(m) window.scrollTo({ top: m.getBoundingClientRect().top + window.scrollY - 8, behavior:'smooth' }); }); $('searchInput')?.addEventListener('keyup',(e)=>{ if(e.key==='Enter') applyFilters(); }); $('moduleFilter')?.addEventListener('change', ()=> applyFilters()); }
  (async function init(){ initListeners(); await loadModules(); await loadInstructions(); const params=new URLSearchParams(window.location.search); const instId=params.get('inst'); if(instId){ const inst = instructionsCache.find(i=>i.id===instId); if(inst) setTimeout(()=>openInstructionModal(inst),300); } })();
})();