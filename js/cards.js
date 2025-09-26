// cards-presenca: navegação de cidades (BR e INT)
// Assuma que existe #card-br e #card-int no HTML.

const citiesBR = [
  { src: "images/cities/sp.jpg",       name: "São Paulo" },
  { src: "images/cities/rj.jpeg",       name: "Rio de Janeiro" },
  { src: "images/cities/brasilia.png", name: "Brasília" },
  { src: "images/cities/itajai.jpeg",   name: "Itajaí" },
  { src: "images/anapolis.jpeg", name: "Anápolis" },
  { src: "images/cities/bahia.jpg",    name: "Bahia" }
];

const citiesINT = [
  { src: "images/cities/miami.jpg",        name: "Miami (EUA)" },
  { src: "images/cities/mexico.jpeg",       name: "Cidade do México" },
  { src: "images/cities/bogota.jpeg",       name: "Bogotá" },
  { src: "images/cities/buenos.jpeg", name: "Buenos Aires" }
];

function initCityCard(cardId, list, tagText){
  const card = document.getElementById(cardId);
  if(!card) return;

  const img    = card.querySelector(".city .photo");
  const nameEl = card.querySelector(".city .name");
  const tagEl  = card.querySelector(".city .tag");
  const prev   = card.querySelector(".prev");
  const next   = card.querySelector(".next");
  const face   = card.querySelector(".city");

  if(!img || !nameEl || !tagEl || !prev || !next || !face) return;

  let i = 0;
  tagEl.textContent = tagText;

  function show(idx, dir = 1){
    i = (idx + list.length) % list.length;

    // micro-transição
    img.style.opacity = "0";
    img.style.transform = `scale(${dir > 0 ? 1.02 : 0.98})`;
    setTimeout(()=>{
      img.src = list[i].src;
      img.alt = list[i].name;
      nameEl.textContent = list[i].name;
      img.style.opacity = "1";
      img.style.transform = "scale(1)";
    }, 120);
  }

  prev.addEventListener("click", ()=> show(i - 1, -1));
  next.addEventListener("click", ()=> show(i + 1, +1));
  face.addEventListener("click", ()=> show(i + 1, +1)); // clicar na foto avança

  // Acessibilidade: setas pelo teclado quando o card tem foco
  card.tabIndex = 0;
  card.addEventListener("keydown", (e)=>{
    if(e.key === "ArrowLeft")  show(i - 1, -1);
    if(e.key === "ArrowRight") show(i + 1, +1);
  });

  show(0);
}

// Inicializa quando o DOM estiver pronto (se usar defer, isso é redundante mas seguro)
document.addEventListener("DOMContentLoaded", ()=>{
  initCityCard("card-br",  citiesBR,  "Brasil");
  initCityCard("card-int", citiesINT, "Internacional");
});
