// ==== PROGRESSO VERTICAL DA LINHA (corrigido) ====
function setupVerticalRailProgress(container){
  const rail = document.querySelector('.v-rail');
  const prog = document.getElementById('v-progress');
  if (!container || !rail || !prog) return;

  // limites da seção (do topo ao fim do container)
  function computeBounds(){
    const rect = container.getBoundingClientRect();
    const start = window.scrollY + rect.top;           // topo da seção
    const end   = start + container.scrollHeight;      // fim da seção
    return { start, end };
  }

  let bounds = computeBounds();

  function update(){
    const { start, end } = bounds;
    const mid = window.scrollY + window.innerHeight * 0.5; // meio da viewport

    // linha só aparece quando estamos dentro da seção (com colchão)
    const inSection = mid > (start - window.innerHeight * 0.15) &&
                      mid < (end   + window.innerHeight * 0.15);
    rail.classList.toggle('is-active', inSection);

    if (inSection){
      const raw = (mid - start) / (end - start);
      const pct = Math.max(0, Math.min(1, raw));       // clamp 0..1
      prog.style.height = (pct * 100) + 'vh';          // cresce dentro da rail fixa
    }
  }

  // Reage a rolagem/redimensionamento
  window.addEventListener('scroll', update, { passive:true });
  window.addEventListener('resize', () => { bounds = computeBounds(); update(); });

  // Recalcula após o load (imagens/fontes)
  window.addEventListener('load', () => { bounds = computeBounds(); update(); });

  // Recalcula quando imagens internas terminarem de carregar
  container.querySelectorAll('img').forEach(img => {
    if (!img.complete) {
      img.addEventListener('load', () => { bounds = computeBounds(); update(); }, { once:true });
    }
  });

  // Primeira medição
  bounds = computeBounds();
  update();
}

// Chame após configurar o reveal/zoom:
// ===== REVEAL 1-a-1 (vertical) — aparece só o card central =====
(function initReveal(){
  const container = document.getElementById('hscroll');
  if (!container) return;
  const steps = Array.from(container.querySelectorAll('.step'));

  // garante o 1º visível no carregamento
  steps.forEach(s => s.classList.remove('is-revealed'));
  steps[0]?.classList.add('is-revealed');

  // Usa IO para detectar quais estão no viewport
  let visibleSet = new Set();
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        visibleSet.add(en.target);
      } else {
        visibleSet.delete(en.target);
      }
    });
    pickCenter(); // decide qual fica revelado
  }, {
    root: null,
    threshold: [0.25, 0.5, 0.75],
    rootMargin: '0px 0px -10% 0px'
  });
  steps.forEach(s => io.observe(s));

  // escolhe o elemento mais próximo do centro da viewport e revela só ele
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

    steps.forEach(s => s.classList.remove('is-revealed'));
    best.classList.add('is-revealed');
  }

  // também decide ao rolar/redimensionar
  window.addEventListener('scroll', pickCenter, { passive:true });
  window.addEventListener('resize', pickCenter);
  window.addEventListener('load', pickCenter);
  setTimeout(pickCenter, 60);
})();
;
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

      // agenda um frame para ficar suave
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
// ===== Helpers do clique =====
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
  Object.assign(ghost.style, { left: rect.left+'px', top: rect.top+'px', width: rect.width+'px', height: rect.height+'px' });
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
