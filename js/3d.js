
  document.documentElement.classList.add('fx-ready');

  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        e.target.classList.add('in');
        io.unobserve(e.target); // anima uma vez
      }
    });
  }, {threshold: .18, rootMargin: '0px 0px -10% 0px'});

  document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
