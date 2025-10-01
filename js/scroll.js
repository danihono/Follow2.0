
(() => {
  const sec = document.getElementById('team-introduction');
  if (!sec) return;

  const pin   = sec.querySelector('.ti-pin');
  const lines = [...sec.querySelectorAll('.ti-title .line')];
  const sub   = sec.querySelector('.ti-sub');
  const nextTeam = document.querySelector('.team-section'); // se existir logo abaixo

  // calcula o progresso 0→1 dentro da section
  const progressInSection = () => {
    const r = sec.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    // quando o topo da section toca o topo da tela => 0
    // quando o fundo da section toca o topo da tela => 1
    const total = r.height - vh;
    const passed = Math.min(Math.max(0, -r.top), total);
    return total > 0 ? passed / total : 0;
  };

  // revela texto e empurra a team-section
  const render = () => {
    const t = progressInSection();                 // 0 → 1
    const reveal = Math.min(1, Math.max(0, t * 1.2));  // um pouco mais rápido

    // cada linha revela da esquerda → direita
    lines.forEach((el, i) => {
      const local = Math.min(1, Math.max(0, reveal - i*0.12));
      const right = (1 - local) * 100;            // 100% oculto → 0% visível
      el.style.clipPath = `inset(0 ${right}% 0 0)`;
    });

    // subtítulo “aproxima”
    sub.style.opacity   = reveal >= 0.35 ? 1 : reveal / 0.35;
    sub.style.transform = `translateX(${(1 - Math.min(1, reveal)) * -6}vw)`;

    // handoff: traz a .team-section da direita
    if (nextTeam) {
      const off = (1 - Math.min(1, t*1.1)) * 12;  // 12vw → 0
      nextTeam.style.transform = `translateX(${off}vw)`;
    }
  };

  // Idle detector para acionar o fade-in do BG
  let idleTimer;
  const setIdle = () => { pin.classList.add('is-idle'); };
  const unsetIdle = () => { pin.classList.remove('is-idle'); clearTimeout(idleTimer); idleTimer = setTimeout(setIdle, 350); };

  // listeners
  window.addEventListener('scroll', () => { unsetIdle(); render(); }, { passive:true });
  window.addEventListener('resize', render);
  unsetIdle();  // inicia timer
  render();     // primeira pintura
})();

(function partnersReveal(){
  // garante .fx-ready no body (se teu script global já faz isso, ok)
  if (!document.body.classList.contains('fx-ready')) {
    document.addEventListener('DOMContentLoaded', ()=>document.body.classList.add('fx-ready'), {once:true});
  }

  const targets = document.querySelectorAll('#clientes .ps-step.reveal, #clientes .ps-title.reveal');
  if (!targets.length) return;

  const io = new IntersectionObserver((entries, obs)=>{
    entries.forEach(en=>{
      if (en.isIntersecting){
        en.target.classList.add('in');   // revela o item
        obs.unobserve(en.target);        // revela só 1x (tire se quiser repetir)
      }
    });
  }, {
    threshold: 0.15,            // mais permissivo para steps altos (~90vh)
    rootMargin: '0px 0px -10% 0px'
  });

  targets.forEach(el=>io.observe(el));

  // se tiver imagens grandes dentro dos steps, recalcule depois que carregarem
  document.querySelectorAll('#clientes .ps-step img').forEach(img=>{
    if (!img.complete) img.addEventListener('load', ()=>io.observe(img.closest('.ps-step')), {once:true});
  });
})();

// aplica delays crescentes nos filhos .reveal
(function partnersStagger(){
  const group = document.querySelector('#clientes .ps-steps');
  if (!group) return;
  const step = parseInt(group.getAttribute('data-stagger') || '140', 10);
  let i = 0;
  group.querySelectorAll('.reveal').forEach(el=>{
    if (!el.dataset.delay) el.dataset.delay = String(i * step);
    i++;
    // usa o data-delay na transição
    const d = parseInt(el.dataset.delay, 10) || 0;
    el.style.transitionDelay = (d/1000) + 's';
  });
})();
