
(() => {
  const nums = document.querySelectorAll('.kpi .num');
  if (!nums.length) return;

  const easeOut = t => 1 - Math.pow(1 - t, 4);

  function animate(el){
    const to = parseInt(el.getAttribute('data-to') || '0', 10);
    const plus = el.getAttribute('data-plus') || '';
    const dur = 1100 + Math.random()*500;
    const start = performance.now();

    function tick(now){
      const p = Math.min(1, (now - start) / dur);
      const v = Math.round(easeOut(p) * to);
      el.textContent = v + plus;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  const io = new IntersectionObserver((entries, obs)=>{
    entries.forEach(en=>{
      if (en.isIntersecting){
        animate(en.target);
        obs.unobserve(en.target);
      }
    });
  }, {threshold: 0.5});

  nums.forEach(n => io.observe(n));
})();
(function devPinPicker(){
  const map = document.querySelector('.geo-map');
  if (!map) return;

  // HUD simples
  const hud = document.createElement('div');
  hud.style.cssText = `
    position:fixed;left:12px;bottom:12px;z-index:9999;
    font:12px/1.2 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    background:rgba(0,0,0,.6);color:#9ad4ff;border:1px solid rgba(255,255,255,.15);
    border-radius:8px;padding:8px 10px;white-space:pre;pointer-events:none
  `;
  hud.textContent = 'Clique no mapa para copiar as coords';
  document.body.appendChild(hud);

  // clique = mostra e copia as coords (em %)
  map.addEventListener('click', (e)=>{
    const r = map.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width * 100).toFixed(1);
    const y = ((e.clientY - r.top)  / r.height* 100).toFixed(1);

    const css = `style="--x:${x}%; --y:${y}%"`;
    navigator.clipboard?.writeText(css).catch(()=>{});
    hud.textContent = `--x:${x}%; --y:${y}%  (copiado)`;

    // desenha um ponto temporário onde clicou
    const dot = document.createElement('div');
    dot.style.cssText = `
      position:absolute;left:${x}%;top:${y}%;
      transform:translate(-50%,-50%);width:10px;height:10px;border-radius:50%;
      background:#2FA3FF;box-shadow:0 0 14px rgba(47,163,255,.9);z-index:999;
      pointer-events:none
    `;
    map.appendChild(dot);
    setTimeout(()=>dot.remove(), 1500);
  });
})();

(function devArcMaker(){
  const map = document.querySelector('.geo-map');
  const svg = document.querySelector('.geo-arcs');
  if (!map || !svg) return;

  const VBW = 1000, VBH = 600; // seu viewBox
  let first = null;

  function percentToVB(xPct, yPct){
    return [ (xPct/100)*VBW, (yPct/100)*VBH ];
  }

  function cubicFrom(p1, p2, curvature = 0.22){
    // controla a "barriga" da curva
    const [x1,y1] = p1, [x2,y2] = p2;
    const dx = x2 - x1, dy = y2 - y1;
    const cx1 = x1 + dx*curvature, cy1 = y1 - Math.abs(dy)*curvature*1.2;
    const cx2 = x2 - dx*curvature, cy2 = y2 - Math.abs(dy)*curvature*1.2;
    return `M ${x1.toFixed(0)} ${y1.toFixed(0)} C ${cx1.toFixed(0)} ${cy1.toFixed(0)}, ${cx2.toFixed(0)} ${cy2.toFixed(0)}, ${x2.toFixed(0)} ${y2.toFixed(0)}`;
  }

  map.addEventListener('contextmenu', e => e.preventDefault()); // botão direito útil
  map.addEventListener('mousedown', (e)=>{
    if (e.button !== 2 && e.button !== 0) return; // esquerdo ou direito
    const r = map.getBoundingClientRect();
    const xPct = ((e.clientX - r.left)/r.width)*100;
    const yPct = ((e.clientY - r.top) /r.height)*100;
    const p = percentToVB(xPct, yPct);

    if (!first){
      first = p;
      console.log('Ponto A:', p.map(n=>n.toFixed(0)));
    } else {
      const d = cubicFrom(first, p, 0.24); // ajuste a curvatura
      first = null;

      // cria a <path> na hora (opcional)
      const path = document.createElementNS('http://www.w3.org/2000/svg','path');
      path.setAttribute('class','arc');
      path.setAttribute('d', d);
      svg.appendChild(path);

      // copia para a área de transferência
      const line = `<path class="arc" d="${d}" />`;
      navigator.clipboard?.writeText(line).catch(()=>{});
      console.log('ARC:', line, '(copiado)');
    }
  });
})();

(function makeArcs(){
  const svg = document.querySelector('.geo-arcs');
  const pins = [...document.querySelectorAll('.pins .pin')];
  if (!svg || !pins.length) return;

  const VBW = 1000, VBH = 600; // seu viewBox

  // conexões: use data-id dos pinos
  const links = [
    ['sp','mia'],
    ['sp','mex'],
    ['bog','sp'],
    ['bue','sp'],     // exemplo extra
    ['ba','mia'],    // exemplo extra
    ['bsb','bue'],    // exemplo extra
    ['rj','mex'],    // exemplo extra
    ['mia','sp'],    // exemplo extra
    ['mex','rj'], 
    ['sp','mia'],
  
];
       // exemplo extra
  

  // pega --x/--y do CSS (em %)
  function getPinXYpct(pin){
    const cs = getComputedStyle(pin);
    const x = parseFloat(cs.getPropertyValue('--x')) || 0;
    const y = parseFloat(cs.getPropertyValue('--y')) || 0;
    return {x, y};
  }
  // % -> coordenada no viewBox
  function pctToVB({x,y}){ return { x: x/100*VBW, y: y/100*VBH }; }

  // curva cúbica com “barriga” suave proporcional à distância
  function cubicD(p1, p2, k = 0.22){
    const dx = p2.x - p1.x, dy = p2.y - p1.y;
    const len = Math.hypot(dx, dy) || 1;
    const curv = Math.min(0.35, k + len/1400*0.12); // curva cresce levemente com a distância

    // controla a barriga (elevação) para cima; troque o sinal de dy no cyN para inverter o lado
    const c1 = { x: p1.x + dx*curv, y: p1.y - Math.abs(dy)*curv*1.2 };
    const c2 = { x: p2.x - dx*curv, y: p2.y - Math.abs(dy)*curv*1.2 };

    return `M ${p1.x.toFixed(0)} ${p1.y.toFixed(0)} C ${c1.x.toFixed(0)} ${c1.y.toFixed(0)}, ${c2.x.toFixed(0)} ${c2.y.toFixed(0)}, ${p2.x.toFixed(0)} ${p2.y.toFixed(0)}`;
  }

  // indexa pinos por data-id
  const byId = Object.fromEntries(pins.map(p => [p.dataset.id, p]));

  // cria paths
  links.forEach(([a,b])=>{
    const pa = byId[a], pb = byId[b];
    if (!pa || !pb) return;

    const A = pctToVB( getPinXYpct(pa) );
    const B = pctToVB( getPinXYpct(pb) );

    const d = cubicD(A, B, 0.22);

    const path = document.createElementNS('http://www.w3.org/2000/svg','path');
    path.setAttribute('class','arc');
    path.setAttribute('d', d);
    svg.appendChild(path);
  });
})();

// remove APENAS o HUD "Clique no mapa..."
document.querySelectorAll('body > div').forEach(el=>{
  if ((el.textContent||'').includes('Clique no mapa para copiar as coords')) el.remove();
});

// (opcional) desativa cliques no mapa, sem remover listeners:
document.querySelector('.geo-map')?.classList.add('map-readonly');
// anima as rotas já criadas pelo makeArcs (linha lisa desenhando A -> B)
(function animateArcsCycle(){
  const svg = document.querySelector('.geo-arcs');
  if (!svg) return;

  // garante que os <path.arc> já existem (ordem de execução)
  const start = () => {
    const arcs = [...svg.querySelectorAll('.arc')];
    if (!arcs.length) return;

    // tempos (ajuste à vontade)
    const DRAW_MS = 3200;   // tempo para desenhar de ponta a ponta
    const HOLD_MS = 1200;   // tempo totalmente desenhado (parado)
    const FADE_MS = 420;    // fade para apagar
    const STAGGER = 160;    // atraso incremental entre arcos (0 = todos juntos)

    // mede comprimentos e prepara estado inicial
    const lens = arcs.map(p => {
      const L = p.getTotalLength();
      p.style.animation  = 'none';   // evita conflitos de CSS
      p.style.transition = 'none';
      p.style.strokeDasharray  = `${L}`;
      p.style.strokeDashoffset = `${L}`; // “vazio”: pronto pra revelar
      p.style.opacity = '0';
      return L;
    });

    function run(){
      // desenha A -> B devagar (cada um com um pequeno atraso)
      arcs.forEach((p, i) => {
        const L = lens[i];
        p.style.transition = 'none';
        p.style.strokeDasharray  = `${L}`;
        p.style.strokeDashoffset = `${L}`;
        p.style.opacity = '1'; // visível, mas “vazio”

        setTimeout(() => {
          p.style.transition = `stroke-dashoffset ${DRAW_MS}ms cubic-bezier(.22,1,.36,1)`;
          p.style.strokeDashoffset = '0'; // revela do início ao fim
        }, STAGGER * i);
      });

      // depois que todos terminam + hold, fade e reset
      const total = STAGGER * (arcs.length - 1) + DRAW_MS + HOLD_MS;

      setTimeout(() => {
        // apaga
        arcs.forEach(p => {
          p.style.transition = `opacity ${FADE_MS}ms ease`;
          p.style.opacity = '0';
        });

        // reseta e reinicia o ciclo
        setTimeout(() => {
          arcs.forEach((p, i) => {
            const L = lens[i];
            p.style.transition = 'none';
            p.style.strokeDasharray  = `${L}`;
            p.style.strokeDashoffset = `${L}`;
          });
          run();
        }, FADE_MS + 20);
      }, total);
    }

    run();
  };

  // se makeArcs já rodou, começa; se não, espera 1 frame
  if (svg.querySelector('.arc')) {
    start();
  } else {
    requestAnimationFrame(start);
  }
})();
// === FILTRO POR REGIÃO + RESTART DOS ARCOS ===
(function geoFiltersAndArcs(){
  const svg  = document.querySelector('.geo-arcs');
  const pins = [...document.querySelectorAll('.pins .pin')];
  const regionBtns = [...document.querySelectorAll('.legend.regions [data-region]')];
  const cta = document.querySelector('.geo-panel .cta');
  if(!svg || !pins.length || !regionBtns.length) return;

  // mapa: id do pino -> elemento
  const byId = Object.fromEntries(pins.map(p => [p.dataset.id, p]));

  // use os mesmos links que você já usa no makeArcs:
  const LINKS = [
    ['sp','mia'], ['sp','mex'], ['bog','sp'],
    ['bue','sp'], ['ba','mia'], ['bsb','bue'] 
  ];

  // conjuntos por região (ajuste como quiser)
  const REGIONS = {
    north: new Set(['mia','mex']),                            // EUA/México
    latam: new Set([,'bog','bue']), // América Latina
    brazil: new Set(['sp','rj','ba','bsb'])              // América do Sul
  };

  // --- helpers ---
  function clearArcs(){ svg.innerHTML = ''; }

  // desenha só as rotas cujos dois pontos estão na região
  function drawArcsFor(regionSet){
    clearArcs();
    LINKS.forEach(([a,b])=>{
     if(!(regionSet.has(a) || regionSet.has(b))) return;
      const pa = byId[a], pb = byId[b];
      if(!pa || !pb) return;

      // lê --x/--y (%), converte pra viewBox (1000 x 600)
      const VBW=1000, VBH=600;
      const getPct = el => {
        const cs = getComputedStyle(el);
        return {
          x: parseFloat(cs.getPropertyValue('--x')) || 0,
          y: parseFloat(cs.getPropertyValue('--y')) || 0
        };
      };
      const A = getPct(pa), B = getPct(pb);
      const p1 = { x: A.x/100*VBW, y: A.y/100*VBH };
      const p2 = { x: B.x/100*VBW, y: B.y/100*VBH };

      // curva suave (mesma lógica do seu makeArcs)
      const dx = p2.x - p1.x, dy = p2.y - p1.y;
      const len = Math.hypot(dx, dy) || 1;
      const k = Math.min(0.35, 0.22 + len/1400*0.12);
      const c1 = { x: p1.x + dx*k, y: p1.y - Math.abs(dy)*k*1.2 };
      const c2 = { x: p2.x - dx*k, y: p2.y - Math.abs(dy)*k*1.2 };
      const d  = `M ${p1.x|0} ${p1.y|0} C ${c1.x|0} ${c1.y|0}, ${c2.x|0} ${c2.y|0}, ${p2.x|0} ${p2.y|0}`;

      const path = document.createElementNS('http://www.w3.org/2000/svg','path');
      path.setAttribute('class','arc');
      path.setAttribute('d', d);
      svg.appendChild(path);
    });

    // anima ciclo (desenha -> segura -> apaga -> repete)
    animateCycle();
  }

  // aplica dim nos pinos fora do conjunto
  function dimPins(regionSet){
    pins.forEach(p => p.classList.toggle('is-dim', !regionSet.has(p.dataset.id)));
  }

  // estado UI ativo
  function setActive(btn){
    regionBtns.forEach(b => b.classList.toggle('is-active', b === btn));
  }

  // animação dos arcos (independente do makeArcs)
  function animateCycle(){
    const arcs = [...svg.querySelectorAll('.arc')];
    if(!arcs.length) return;

    const DRAW_MS = 3200, HOLD_MS = 1000, FADE_MS = 380, STAGGER = 140;

    // prepara
    const lens = arcs.map(p => {
      const L = p.getTotalLength();
      p.style.animation = 'none';
      p.style.transition = 'none';
      p.style.strokeDasharray  = `${L}`;
      p.style.strokeDashoffset = `${L}`;
      p.style.opacity = '0';
      return L;
    });

    function run(){
      arcs.forEach((p,i)=>{
        const L = lens[i];
        p.style.transition = 'none';
        p.style.strokeDasharray  = `${L}`;
        p.style.strokeDashoffset = `${L}`;
        p.style.opacity = '1';
        setTimeout(()=>{
          p.style.transition = `stroke-dashoffset ${DRAW_MS}ms cubic-bezier(.22,1,.36,1)`;
          p.style.strokeDashoffset = '0';
        }, STAGGER*i);
      });

      const total = STAGGER*(arcs.length-1)+DRAW_MS+HOLD_MS;
      setTimeout(()=>{
        arcs.forEach(p=>{
          p.style.transition = `opacity ${FADE_MS}ms ease`;
          p.style.opacity = '0';
        });
        setTimeout(()=>{
          arcs.forEach((p,i)=>{
            const L = lens[i];
            p.style.transition = 'none';
            p.style.strokeDasharray  = `${L}`;
            p.style.strokeDashoffset = `${L}`;
          });
          run();
        }, FADE_MS + 20);
      }, total);
    }
    run();
  }

  // aplica região escolhida
  function applyRegion(key){
    const set = REGIONS[key] || new Set();
    dimPins(set);
    drawArcsFor(set);
  }

  // listeners nos 3 itens
  regionBtns.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      setActive(btn);
      applyRegion(btn.dataset.region);
    });
  });

  // botão “Explorar localidades” só reinicia as rotas da região ativa
  cta?.addEventListener('click', (e)=>{
    e.preventDefault();
    const active = regionBtns.find(b=>b.classList.contains('is-active')) || regionBtns[0];
    if(active){
      setActive(active);
      applyRegion(active.dataset.region); // redesenha e reinicia ciclo
    }
  });

  // inicial: marca uma região e aplica
  setActive(regionBtns[0]);
  applyRegion(regionBtns[0].dataset.region);
})();
// antes (pegava <li>):
// const items = ul ? [...ul.querySelectorAll('li')] : [];

// depois (pega qualquer elemento com data-region — inclusive <button>):
const items = ul ? [...ul.querySelectorAll('[data-region]')] : [];
