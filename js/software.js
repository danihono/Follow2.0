document.addEventListener('DOMContentLoaded', () => {
  // ... (mantém o reveal, stagger, parallax e tilt que já enviei)

  // === Lazy background para cards e poster do vídeo ===
  const bgTargets = document.querySelectorAll('#software .float-card, #software .player-poster');
  const setBG = el => {
    const url = el.getAttribute('data-bg');
    if (url){
      el.style.backgroundImage = `url('${url}')`;
      el.classList.add('is-loaded');
    }
  };
  if ('IntersectionObserver' in window){
    const ioBG = new IntersectionObserver((entries, obs)=>{
      entries.forEach(en=>{
        if (en.isIntersecting){ setBG(en.target); obs.unobserve(en.target); }
      });
    }, { rootMargin: '200px 0px' });
    bgTargets.forEach(t => ioBG.observe(t));
  } else {
    bgTargets.forEach(setBG);
  }

  // (opcional) sombra “respirando” nos botões primários
  document.querySelectorAll('#software .btn-primary').forEach(btn=>{
    let t=0;
    function pulse(){
      t+=0.02;
      btn.style.boxShadow = `0 0 0 ${8 + Math.sin(t)*6}px rgba(89,191,255,.08)`;
      requestAnimationFrame(pulse);
    }
    pulse();
  });
});
