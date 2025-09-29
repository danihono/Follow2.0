// ---- Counters (versão estável: sem "pulos" e sincronizada com reveal/3D) ----
(function(){
  const counters = Array.from(document.querySelectorAll('.counter'));
  if (!counters.length) return;

  // Valor inicial "0" com prefix/sufixo
  counters.forEach(el=>{
    el.textContent = (el.dataset.prefix || '') + '0' + (el.dataset.suffix || '');
  });

  // Observa o elemento mais "representativo" (card/reveal) para evitar animar fora de cena
  const targetMap = new Map(); // watchEl -> counterEl
  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver(onIntersect, { threshold: 0.6, rootMargin: '0px 0px -10% 0px' })
    : null;

  counters.forEach(el=>{
    const watchEl = el.closest('.tech-card, .card, .reveal') || el;
    targetMap.set(watchEl, el);
    if (io) io.observe(watchEl); else start(el);
  });

  function onIntersect(entries){
    entries.forEach(en=>{
      if (!en.isIntersecting) return;
      const el = targetMap.get(en.target);
      if (!el) return;

      // Só começa após o reveal (se existir)
      waitUntilRevealed(el, ()=> start(el));

      io.unobserve(en.target);
      targetMap.delete(en.target);
    });
  }

  // Espera o pai .reveal ficar visível (classe .in ou .is-visible)
  function waitUntilRevealed(el, cb){
    const rev = el.closest('.reveal');
    if (!rev) { cb(); return; }
    if (rev.classList.contains('in') || rev.classList.contains('is-visible')) { cb(); return; }
    const mo = new MutationObserver(()=>{
      if (rev.classList.contains('in') || rev.classList.contains('is-visible')){
        mo.disconnect(); cb();
      }
    });
    mo.observe(rev, { attributes:true, attributeFilter:['class'] });
  }

  // Parser robusto (120.000,50 → 120000.50)
  function parseTarget(raw){
    if (raw == null) return 0;
    const s = String(raw).trim().replace(/\./g,'').replace(/,/g,'.');
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  }

  function start(el){
    if (el._counting) return;
    el._counting = true;

    const target   = parseTarget(el.dataset.count || 0);
    const prefix   = el.dataset.prefix || '';
    const suffix   = el.dataset.suffix || '';
    const locale   = el.dataset.format || 'pt-BR';
    const decimals = Number(el.dataset.decimals || 0);
    const duration = Math.max(300, Number(el.dataset.duration || 2500));

    const fmt = new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
    const ease = t => 1 - Math.pow(1 - t, 3); // easeOutCubic

    // *** Começa no PRIMEIRO rAF pra evitar “pulo” por atraso de frame
    requestAnimationFrame((t0)=>{
      const start = t0;
      function frame(now){
        const t = Math.min(1, (now - start) / duration);
        const vRaw = target * ease(t);
        const val  = decimals ? Number(vRaw.toFixed(decimals)) : Math.round(vRaw);
        el.textContent = prefix + fmt.format(val) + suffix;
        if (t < 1) requestAnimationFrame(frame);
        else el.textContent = prefix + fmt.format(target) + suffix; // travo no final exato
      }
      frame(t0);
    });
  }
})();
