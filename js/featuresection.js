// ==== PROGRESSO VERTICAL + MARCAÇÃO DAS BOLINHAS ====
function setupVerticalRailProgress(container){
  const rail  = document.querySelector('.v-rail');
  const prog  = document.getElementById('v-progress');
  const steps = Array.from(container?.querySelectorAll('.step') || []);
  if (!container || !rail || !prog || steps.length === 0) return;

  function computeBounds(){
    const rect  = container.getBoundingClientRect();
    const start = window.scrollY + rect.top;           // topo absoluto da seção
    const end   = start + container.scrollHeight;      // fim absoluto da seção
    return { start, end };
  }

  let bounds = computeBounds();

  function update(){
    const { start, end } = bounds;
    const mid = window.scrollY + window.innerHeight * 0.5; // meio da viewport

    // rail só ativa dentro da seção
    const inSection = mid > (start - window.innerHeight*0.15) &&
                      mid < (end   + window.innerHeight*0.15);
    rail.classList.toggle('is-active', inSection);

    // progresso 0..1 e altura da barra dentro da rail
    const raw = (mid - start) / (end - start);
    const pct = Math.max(0, Math.min(1, raw));
    prog.style.height = (pct * 100) + 'vh';

    // posição do progresso em PX dentro da SEÇÃO
    const progressPx = pct * container.scrollHeight;

    // marcar bolinhas já alcançadas + detectar step atual (mais perto do centro)
    let current = null, bestDist = Infinity;
    const vMid = window.innerHeight / 2;

    steps.forEach(step => {
      // alvo da bolinha (~meio do step). Quer acender antes? use 0.35
      const dotCenter = step.offsetTop + step.offsetHeight * 0.5; // relativo ao container
      const isPassed  = dotCenter <= progressPx + 1;              // tolerância 1px
      step.classList.toggle('is-passed', isPassed);

      // achar o step mais próximo do centro da viewport
      const r = step.getBoundingClientRect();
      const d = Math.abs((r.top + r.height/2) - vMid);
      if (d < bestDist){ bestDist = d; current = step; }
    });

    // aplica “atual” em um único step
    steps.forEach(s => s.classList.remove('is-current'));
    if (current) current.classList.add('is-current');
  }

  window.addEventListener('scroll', update, { passive:true });
  window.addEventListener('resize', () => { bounds = computeBounds(); update(); });
  window.addEventListener('load',   () => { bounds = computeBounds(); update(); });
  container.querySelectorAll('img').forEach(img => {
    if (!img.complete) img.addEventListener('load', () => { bounds = computeBounds(); update(); }, { once:true });
  });

  bounds = computeBounds();
  update();
}

// ===== REVEAL 1-a-1 (vertical) — aparece só o card central =====
(function initReveal(){
  const container = document.getElementById('hscroll');
  if (!container) return;
  const steps = Array.from(container.querySelectorAll('.step'));

  // reseta e garante o primeiro visível/atual
  steps.forEach(s => { s.classList.remove('is-revealed','is-current'); });
  steps[0]?.classList.add('is-revealed','is-current');

  // IO para saber quem está na viewport
  let visibleSet = new Set();
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) visibleSet.add(en.target);
      else                   visibleSet.delete(en.target);
    });
    pickCenter();
  }, { threshold: [0.25, 0.5, 0.75], rootMargin: '0px 0px -10% 0px' });
  steps.forEach(s => io.observe(s));

  // revela só o step mais perto do centro da viewport
  function pickCenter(){
    if (!visibleSet.size) return;
    let best = null, bestDist = 1e9;
    const mid = window.innerHeight / 2;
    visibleSet.forEach(el => {
      const r = el.getBoundingClientRect();
      const center = r.top + r.height/2;
      const d = Math.abs(center - mid);
      if (d < bestDist){ bestDist = d; best = el; }
    });
    if (!best) return;
    steps.forEach(s => { s.classList.remove('is-revealed','is-current'); });
    best.classList.add('is-revealed','is-current');
  }

  window.addEventListener('scroll', pickCenter, { passive:true });
  window.addEventListener('resize', pickCenter);
  window.addEventListener('load', pickCenter);
  setTimeout(pickCenter, 60);
})();

// Inicializa a rail (chame após o DOM existir / use <script defer>)
setupVerticalRailProgress(document.getElementById('hscroll'));

// === Tilt suave no hover + brilho que acompanha o mouse ===
(function enableCardTilt(){
  if (matchMedia('(hover: none)').matches) return; // mobile: sem tilt

  const cards = document.querySelectorAll('.tech-card');
  const MAX_ROT_X = 8;   // graus
  const MAX_ROT_Y = 10;  // graus

  cards.forEach(card => {
    let raf = null;

    function onMove(e){
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;   // 0..1
      const py = (e.clientY - r.top)  / r.height;  // 0..1
      const rotX = (0.5 - py) * (MAX_ROT_X * 2);
      const rotY = (px - 0.5) * (MAX_ROT_Y * 2);

      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        card.style.transform =
          `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.02)`;
        // move a “luz”
        card.style.setProperty('--mx', (px * 100) + '%');
        card.style.setProperty('--my', (py * 100) + '%');
      });
    }

    function onLeave(){
      if (raf) cancelAnimationFrame(raf);
      card.style.transform = '';                   // volta ao normal
      card.style.removeProperty('--mx');
      card.style.removeProperty('--my');
    }

    card.addEventListener('mousemove', onMove);
    card.addEventListener('mouseleave', onLeave);
  });
})();

// ===== Helpers do clique (zoom -> vídeo) =====
function getCardImgUrl(card){
  // 1) <img src>
  const tagImg = card.querySelector('img');
  if (tagImg && tagImg.getAttribute('src')) {
    return tagImg.getAttribute('src').replace(/\\/g,'/');
  }
  // 2) CSS var --img
  const style = card.getAttribute('style') || '';
  const m = style.match(/--img:\s*url\(['"]?([^'")]+)['"]?\)/i);
  return m ? m[1] : null;
}

function openVideoOverlay({ title, desc, video }){
  const overlay  = document.getElementById('zoom-overlay');
  const mediaBox = overlay.querySelector('.zoom-media');
  const titleEl  = overlay.querySelector('.zoom-title');
  const descEl   = overlay.querySelector('.zoom-desc');
  const closeBtn = overlay.querySelector('.close-zoom');

  if (titleEl) titleEl.textContent = title || '';
  if (descEl)  descEl.textContent  = desc  || '';
  mediaBox.innerHTML = '';

  if (video){
    const v = document.createElement('video');
    v.src = video.replace(/\\/g,'/');
    v.autoplay = true; v.loop = true; v.muted = true; v.playsInline = true;
    v.setAttribute('preload','auto');
    mediaBox.appendChild(v);
  }

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  closeBtn && closeBtn.focus();

  const close = (e)=>{
    if (e.target === overlay || e.target.closest('.close-zoom')){
      overlay.classList.remove('open');
      document.body.style.overflow = '';
      mediaBox.innerHTML = '';
      overlay.removeEventListener('click', close);
    }
  };
  overlay.addEventListener('click', close);
  document.addEventListener('keydown', (e)=>{
    if (e.key === 'Escape' && overlay.classList.contains('open')) close({target: overlay});
  }, { once:true });
}

function animateZoomThenVideo(card){
  const imgUrl = getCardImgUrl(card);
  const video  = card.dataset.video ? card.dataset.video.replace(/\\/g,'/') : null;

  // sem vídeo: só um pulso curto
  if(!video){
    const prev = card.style.transition;
    card.style.transition = 'transform .22s ease';
    card.style.transform = 'scale(1.03)';
    setTimeout(()=>{ card.style.transform=''; card.style.transition = prev; }, 160);
    return;
  }

  // fantasma para o zoom
  const rect = card.getBoundingClientRect();
  const ghost = document.createElement('div');
  ghost.className = 'zoom-ghost';
  ghost.style.backgroundImage = imgUrl ? `url('${imgUrl}')` : 'none';
  Object.assign(ghost.style, {
    left: rect.left+'px', top: rect.top+'px',
    width: rect.width+'px', height: rect.height+'px'
  });
  document.body.appendChild(ghost);

  const targetW = Math.min(innerWidth * 0.8, 900);
  const targetH = targetW * 9 / 16; // 16:9
  const targetL = (innerWidth  - targetW)/2;
  const targetT = (innerHeight - targetH)/2;

  requestAnimationFrame(()=>{
    const dx = targetL - rect.left, dy = targetT - rect.top;
    const sx = targetW / rect.width, sy = targetH / rect.height;
    ghost.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
  });

  ghost.addEventListener('transitionend', ()=>{
    openVideoOverlay({ title: card.dataset.title, desc: card.dataset.desc, video });
    ghost.style.opacity = '0';
    setTimeout(()=> ghost.remove(), 220);
  }, { once:true });
}

// Listener de clique no container da timeline
document.getElementById('hscroll')?.addEventListener('click', (e)=>{
  const card = e.target.closest('.tech-card');
  if(!card) return;
  animateZoomThenVideo(card);
});
