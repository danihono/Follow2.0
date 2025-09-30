
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
