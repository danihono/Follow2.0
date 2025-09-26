// js/script.js
document.addEventListener('DOMContentLoaded', () => {
  // habilita os estilos animados (progressive enhancement)
  document.body.classList.add('fx-ready');

  // aplica delays automáticos se houver contêiner com data-stagger
  document.querySelectorAll('[data-stagger]').forEach(group=>{
    const step = parseInt(group.dataset.stagger || '120', 10);
    let i = 0;
    group.querySelectorAll('.reveal').forEach(el=>{
      if (!el.dataset.delay) el.dataset.delay = String(i * step);
      i++;
    });
  });

  const targets = document.querySelectorAll('.reveal, .wipe');
  if (!targets.length) return;

  // Fallback: se não houver IntersectionObserver, mostra tudo
  if (!('IntersectionObserver' in window)) {
    targets.forEach(el => el.classList.add('in'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const d = parseInt(el.dataset.delay || 0, 10);
      if (d) el.style.transitionDelay = (d/1000)+'s';
      el.classList.add('in');
      io.unobserve(el);
    });
  }, { root: null, rootMargin: '0px 0px -10% 0px', threshold: 0.2 });

  targets.forEach(el => io.observe(el));
});
// ---- Counters: contam do 0 até o alvo quando o card entra em vista ----
(function(){
  const els = document.querySelectorAll('.counter');
  if(!els.length) return;

  // mostra 0 já com prefixo/sufixo
  els.forEach(el => {
    el.textContent = (el.dataset.prefix || '') + '0' + (el.dataset.suffix || '');
  });

  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver(onIntersect, { threshold: 0.35 })
    : null;

  els.forEach(el => io ? io.observe(el) : run(el));

  function onIntersect(entries){
    entries.forEach(entry => {
      if(!entry.isIntersecting) return;
      run(entry.target);
      io.unobserve(entry.target);
    });
  }

  function run(el){
    const target   = Number(el.dataset.count || 0);
    const prefix   = el.dataset.prefix || '';
    const suffix   = el.dataset.suffix || '';
    const locale   = el.dataset.format || 'pt-BR';
    const duration = Number(el.dataset.duration || 2500); // <-- mais lento

    const start = performance.now();
    const fmt = new Intl.NumberFormat(locale);

    (function tick(now){
      const t = Math.min(1, (now - start) / duration);
      // easeInOutQuad (suave)
      const eased = t < .5 ? 2*t*t : -1 + (4 - 2*t)*t;
      const val = Math.round(target * eased);

      el.textContent = prefix + fmt.format(val) + suffix;

      if (t < 1) requestAnimationFrame(tick);
    })(start);
  }
})();


