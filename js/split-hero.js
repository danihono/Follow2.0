// Slideshow simples com crossfade
(function(){
  const root  = document.querySelector('#alcance .slides');
  if (!root) return;

  const imgs  = Array.from(root.querySelectorAll('img'));
  if (imgs.length === 0) return;

  const duration = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue('--slide-duration')
  ) || 6000;

  let i = 0;
  function show(n){
    imgs.forEach((im, idx) => im.classList.toggle('is-active', idx === n));
  }
  show(0);

  setInterval(() => {
    i = (i + 1) % imgs.length;
    show(i);
  }, duration);
})();
