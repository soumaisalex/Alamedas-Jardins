const API = '/api';

// ══════ CONFIG ══════
const CAT_ICONS = {
  "água mineral":"💧","ar-condicionado":"❄️","arquiteta":"📐","aulas":"📚","babá":"👶",
  "barbeiro":"💈","cabeleireira":"💇","carregadores":"🔌","corretora":"🏠","costureira":"🧵",
  "cuidadora":"🤝","dedetização":"🪲","dentista":"🦷","designer":"🛋️","eletricista":"⚡",
  "encanador":"🔧","faxineira":"🧹","formatação":"💻","fotografia":"📷","fretes":"🚛",
  "mudanças":"🚛","geladeira":"🧊","guincho":"🚗","impressão":"🖨️","manicure":"💅",
  "box":"🚿","massagem":"💆","motoboy":"🛵","montador":"🪛","nutricionista":"🥗",
  "pedreiro":"🧱","pintor":"🎨","plano de saúde":"🏥","podologia":"🦶","sobrancelha":"✨",
  "sofá":"🛋️","transporte escolar":"🚌","veterinária":"🐾","higienização":"🧽",
};
function getIcon(cat){
  const k=cat.toLowerCase();
  for(const[key,icon]of Object.entries(CAT_ICONS)){if(k.includes(key))return icon;}
  return"🛠️";
}


// ══════ TOAST ══════
let toastTimer;
function showToast(msg){
  const t=document.getElementById("toast");
  t.textContent=msg;t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>t.classList.remove("show"),2400);
}
