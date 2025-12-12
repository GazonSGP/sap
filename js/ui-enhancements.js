// public/js/ui-enhancements.js
// Lightweight interaction layer for Aurora Holo UI

(function(){
  // small helpers
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));
  const on = (el, evt, cb) => el && el.addEventListener(evt, cb);

  // 1) Parallax hover for cards
  function initCardParallax(){
    $$('.card.instruction-card').forEach(card => {
      card.setAttribute('data-parallax','on');
      let rect = null;
      card.addEventListener('mousemove', (e) => {
        rect = rect || card.getBoundingClientRect();
        const dx = (e.clientX - (rect.left + rect.width/2)) / rect.width;
        const dy = (e.clientY - (rect.top + rect.height/2)) / rect.height;
        const rx = -dy * 4; // rotate X
        const ry = dx * 6; // rotate Y
        card.style.transform = `translateY(-6px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.01)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transition = 'transform 300ms cubic-bezier(.2,.9,.2,1)';
        card.style.transform = '';
        setTimeout(()=>card.style.transition='',350);
        rect = null;
      });
    });
  }

  // 2) Badge pulsing on filter active
  function initBadgePulse(){
    const moduleFilter = document.getElementById('moduleFilter');
    if (!moduleFilter) return;
    moduleFilter.addEventListener('change', () => {
      const val = moduleFilter.value || '';
      $$('.fiori-badge').forEach(b => {
        b.classList.toggle('pulse', b.dataset.moduleId === val && !!val);
      });
    });
  }

  // 3) Modal show animation controlled via classes already used in CSS (.show)
  function initModalAnimations(){
    const backdrop = document.getElementById('instructionModalBackdrop');
    if (!backdrop) return;
    // ensure close button closes with class removal
    on(backdrop, 'click', (e) => {
      if (e.target === backdrop) closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });

    function closeModal(){
      backdrop.classList.remove('show');
      // small delay to allow CSS hide animation then clear content
      setTimeout(()=> {
        const win = backdrop.querySelector('.modal-window');
        if (win) win.innerHTML = '';
        backdrop.style.display = 'none';
      }, 260);
    }

    // intercept open: when visible add class
    const observer = new MutationObserver((mut) => {
      mut.forEach(m => {
        if (m.attributeName === 'style' || m.attributeName === 'class') {
          if (backdrop.style.display === 'flex' || backdrop.classList.contains('show')) {
            backdrop.classList.add('show');
            backdrop.style.display = 'flex';
            // blur background main
            document.querySelector('main')?.classList.add('modal-open-blur');
            // ensure focus inside
            setTimeout(()=> backdrop.querySelector('.modal-window')?.focus(), 150);
          }
        }
      });
    });
    observer.observe(backdrop, { attributes: true, attributeFilter: ['style','class'] });
  }

  // 4) Lightbox enhancement
  function initLightbox(){
    const lb = document.getElementById('imageLightbox');
    if (!lb) return;
    lb.addEventListener('click', (e) => {
      if (e.target.id === 'imageLightbox' || e.target.tagName === 'IMG') {
        lb.classList.remove('show');
        setTimeout(()=> { lb.style.display = 'none'; const img = document.getElementById('lightboxImg'); if (img) img.src=''; }, 200);
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        lb.classList.remove('show'); lb.style.display='none';
      }
    });
    // open hook used in public.js openImageLightbox => it sets display:flex and src; here add show class
    const orig = window.openImageLightbox;
    if (typeof orig === 'function') {
      window.openImageLightbox = function(src){
        orig(src);
        const img = document.getElementById('lightboxImg');
        if (!img) return;
        // small load handler to show
        img.onload = () => {
          lb.style.display = 'flex';
          setTimeout(()=> lb.classList.add('show'), 8);
        };
        img.onerror = () => {
          lb.style.display = 'none';
        };
      };
    }
  }

  // 5) Thumb click / controls visibility safety (if not set by public.js)
  function initThumbsSafety(){
    // when modal opens, check thumbs count and hide controls if <=1
    document.body.addEventListener('click', (e)=> {
      const openBtn = e.target.closest('.open-instruction');
      if (!openBtn) return;
      setTimeout(()=> {
        const backdrop = document.getElementById('instructionModalBackdrop');
        const controls = backdrop?.querySelector('.media-controls');
        const thumbs = backdrop?.querySelectorAll('.thumb') || [];
        if (controls) {
          if (thumbs.length <= 1) controls.classList.add('hidden');
          else controls.classList.remove('hidden');
        }
      }, 220);
    });
  }

  // 6) Ensure thumbnails have keyboard focus
  function initThumbKeyboard(){
    document.body.addEventListener('keydown', (e) => {
      const backdrop = document.getElementById('instructionModalBackdrop');
      if (!backdrop || backdrop.style.display !== 'flex') return;
      const thumbs = Array.from(backdrop.querySelectorAll('.thumb'));
      if (!thumbs.length) return;
      const activeIndex = thumbs.findIndex(t => t.classList.contains('active'));
      if (e.key === 'ArrowRight') {
        const next = (activeIndex + 1) % thumbs.length;
        thumbs[next].click();
      } else if (e.key === 'ArrowLeft') {
        const prev = (activeIndex - 1 + thumbs.length) % thumbs.length;
        thumbs[prev].click();
      }
    });
  }

  // 7) Re-init on DOM changes (public.js re-renders)
  function observeDom(){
    const main = document.querySelector('main') || document.body;
    const mo = new MutationObserver(()=> {
      // delay to let public.js finish
      setTimeout(() => {
        initCardParallax();
        initBadgePulse();
      }, 50);
    });
    mo.observe(main, { childList: true, subtree: true });
  }

  // init all ui helpers
  function initAll(){ initCardParallax(); initBadgePulse(); initModalAnimations(); initLightbox(); initThumbsSafety(); initThumbKeyboard(); observeDom(); }

  // wait for DOM ready
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAll);
  else initAll();

})();
