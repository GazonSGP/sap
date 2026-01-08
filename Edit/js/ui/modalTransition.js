// ui/modalTransition.js — tuned for smooth & fast feel

let proxy = null;
let fromRect = null;

const DURATION = 200;
const EASING = 'cubic-bezier(.2,.7,.1,1)';

function rectWithout3D(el){
  const t = el.style.transform;
  el.style.transform = 'none';
  const r = el.getBoundingClientRect();
  el.style.transform = t;
  return r;
}

export function animateOpen(card, backdrop){
  if (!card || !backdrop) return;

  fromRect = rectWithout3D(card);

  const cs = getComputedStyle(card);
  proxy = document.createElement('div');
  proxy.className = 'modal-proxy';

  Object.assign(proxy.style,{
    position:'fixed',
    top:fromRect.top+'px',
    left:fromRect.left+'px',
    width:fromRect.width+'px',
    height:fromRect.height+'px',
    background:cs.background,
    borderRadius:cs.borderRadius,
    boxShadow:cs.boxShadow,
    zIndex:3000,
    pointerEvents:'none',
    transition:`
      top ${DURATION}ms ${EASING},
      left ${DURATION}ms ${EASING},
      width ${DURATION}ms ${EASING},
      height ${DURATION}ms ${EASING},
      opacity 80ms ease
    `
  });

  document.body.appendChild(proxy);

  const modal = backdrop.querySelector('.modal-window');
  const target = modal.getBoundingClientRect();

  modal.style.opacity = '0';

  requestAnimationFrame(()=>{
    Object.assign(proxy.style,{
      top:target.top+'px',
      left:target.left+'px',
      width:target.width+'px',
      height:target.height+'px'
    });
  });

  setTimeout(()=>{
    proxy.style.opacity = '0';
    modal.style.opacity = '1';
  }, DURATION - 40);

  setTimeout(()=>{
    proxy.remove();
    proxy = null;
  }, DURATION + 60);
}

export function animateClose(card, backdrop, done){
  if (!card || !fromRect){
    done?.();
    return;
  }

  const modal = backdrop.querySelector('.modal-window');
  const mr = modal.getBoundingClientRect();

  proxy = document.createElement('div');
  proxy.className = 'modal-proxy';

  Object.assign(proxy.style,{
    position:'fixed',
    top:mr.top+'px',
    left:mr.left+'px',
    width:mr.width+'px',
    height:mr.height+'px',
    background:'#e0e8f7',
    borderRadius:'10px',
    boxShadow:'0 40px 100px rgba(0,0,0,.35)',
    zIndex:3000,
    pointerEvents:'none',
    transition:`
      top ${DURATION}ms ${EASING},
      left ${DURATION}ms ${EASING},
      width ${DURATION}ms ${EASING},
      height ${DURATION}ms ${EASING}
    `
  });

  document.body.appendChild(proxy);
  modal.style.opacity = '0';

  requestAnimationFrame(()=>{
    Object.assign(proxy.style,{
      top:fromRect.top+'px',
      left:fromRect.left+'px',
      width:fromRect.width+'px',
      height:fromRect.height+'px'
    });
  });

  setTimeout(()=>{
    proxy.remove();
    proxy = null;
    fromRect = null;
    done?.();
  }, DURATION + 60);
}
