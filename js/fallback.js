
(function stickyFallback(){
  const sec   = document.getElementById('clientes');
  const stick = sec?.querySelector('.ps-stick');
  const asset = sec?.querySelector('.ps-asset');
  if (!sec || !stick || !asset) return;

  // Se o browser suporta sticky e não há transform em ancestrais, sai.
  if (CSS.supports('position', 'sticky')) {
    // Ainda assim, alguns layouts com transform quebram; seguimos com fallback guardado.
  }

  let usingFixed = false, left = 0, width = 0;

  function recalc(){
    const r = asset.getBoundingClientRect();
    width = r.width;
    // posição absoluta da coluna direita
    const rs = stick.getBoundingClientRect();
    left = rs.left + window.scrollX;
  }

  function onScroll(){
    const top    = sec.offsetTop;
    const height = sec.offsetHeight;
    const start  = top;                            // quando entra a seção
    const end    = top + height - asset.offsetHeight - parseInt(getComputedStyle(stick).top || 0);

    const y = window.scrollY;
    const shouldFix = y >= start && y <= end;

    if (shouldFix && !usingFixed){
      recalc();
      asset.style.position = 'fixed';
      asset.style.top = getComputedStyle(stick).top || '0px';
      asset.style.left = left + 'px';
      asset.style.width = width + 'px';
      usingFixed = true;
    } else if (!shouldFix && usingFixed){
      asset.style.position = '';
      asset.style.top = '';
      asset.style.left = '';
      asset.style.width = '';
      usingFixed = false;
    }
  }

  window.addEventListener('scroll', onScroll, {passive:true});
  window.addEventListener('resize', ()=>{ usingFixed && recalc(); onScroll(); });
  window.addEventListener('load',   ()=>{ recalc(); onScroll(); });

  // primeira passada
  recalc(); onScroll();
})();
/* Converte o texto do h3.ps-h em linhas <span>, igual ao seu SCSS.
   Regra: quebra em até 2 linhas “inteligentes” (por comprimento);
   marca primeira e última para delays e cor. */
document.addEventListener('DOMContentLoaded', () => {
  const heads = document.querySelectorAll('#clientes .ps-step .ps-h');
  heads.forEach(h => {
    // já processado?
    if (h.dataset.split === '1') return;
    const txt = (h.textContent || '').trim().replace(/\s+/g, ' ');
    if (!txt) return;

    // heurística simples para 2 linhas: tenta dividir no espaço mais central
    const words = txt.split(' ');
    let cut = Math.floor(words.length / 2);
    // ajusta para não deixar palavras muito curtas na 2ª linha
    if (words.length >= 4 && words[cut].length <= 2) cut++;

    const line1 = words.slice(0, cut).join(' ');
    const line2 = words.slice(cut).join(' ');

    // limpa e cria spans
    h.textContent = '';
    const s1 = document.createElement('span');
    const s2 = document.createElement('span');
    s1.textContent = line1;
    s2.textContent = line2;

    // marcações para delays/cores (como no seu SCSS: last fica amarelo)
    s1.classList.add('is-first');
    s2.classList.add('is-last');

    // opcional: stagger extra se quiser (com data-stagger no h3)
    if (h.hasAttribute('data-stagger')){
      s1.style.setProperty('--stg', '700ms');
      s2.style.setProperty('--stg', '500ms');
      h.setAttribute('data-stagger','');
    }

    h.appendChild(s1);
    h.appendChild(s2);
    h.dataset.split = '1';
  });
});
document.addEventListener('DOMContentLoaded', () => {
  const steps = [...document.querySelectorAll('#clientes .ps-step')];
  if (!steps.length) return;

  const io = new IntersectionObserver((entries) => {
    let best = null, bestDist = Infinity;
    const mid = innerHeight / 2;

    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const r = en.target.getBoundingClientRect();
      const d = Math.abs(r.top + r.height/2 - mid);
      if (d < bestDist){ bestDist = d; best = en.target; }
    });

    if (best){
      steps.forEach(s => s.classList.remove('is-current'));
      best.classList.add('is-current');
    }
  }, { rootMargin: '-30% 0% -30% 0%', threshold: 0 });

  steps.forEach(s => io.observe(s));
});

  // Duplicar os logos para permitir rolagem contínua (seamless)
  (function(){
    const track = document.querySelector('.logo-marquee .logo-track');
    if (!track) return;
    // Clona todo o conteúdo e anexa ao final
    track.appendChild(track.cloneNode(true));
    // Dica: se quiser acelerar/diminuir em runtime, mude --speed no container
  })();
