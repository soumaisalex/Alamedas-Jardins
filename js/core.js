const API = '/api';

// ══════ CONFIG ══════
const CAT_ICONS = {
  "água mineral":"💧","agua mineral":"💧","ar-condicionado":"❄️","arquiteta":"📐","aulas":"📚","babá":"👶",
  "barbeiro":"💈","cabeleireira":"💇","carregadores":"🔌","consórcios":"🔑","corretora":"🏠","costureira":"🧵",
  "cuidadora":"🤝","dedetização":"🪲","dentista":"🦷","designer":"🛋️","depilação":"🪒","eletricista":"⚡","telas de proteção":"🛡️",
  "encanador":"🪠","faxineira":"🧹","festas e eventos":"🎉","fonoaudióloga":"🗣️","formatação":"💻","fotografia":"📷","fretes":"🚛",
  "mudanças":"🚛","geladeira":"🧊","guincho":"🚗","impressão":"🖨️","manicure":"💅","marceneiro":"🪚","personal trainer":"💪",
  "box":"🚿","massagem":"💆","motoboy":"🛵","montador":"🪛","nutricionista":"🥗","fisioterapia":"🦿","psico":"Ψ",
  "pedreiro":"🧱","pintor":"🎨","plano de saúde":"🏥","podologia":"🦶","psicopedagogia":"🧠","sobrancelha":"👀",
  "sofá":"🛋️","transporte escolar":"🚌","veterinária":"🐾","higienização":"🧽","Advogado(a)":"⚖️","advogado":"⚖️",
};
let CAT_OVERRIDES={};   // ícones editados no admin (tabela category_icons)
let adminPw="";         // senha do admin em memória (enviada nas rotas protegidas)
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function defaultIcon(cat){
  const k=cat.toLowerCase();
  for(const[key,icon]of Object.entries(CAT_ICONS)){if(k.includes(key))return icon;}
  return"🛠️";
}
function getIcon(cat){
  return CAT_OVERRIDES[cat.toLowerCase()]||defaultIcon(cat);
}


// ══════ TOAST ══════
let toastTimer;
function showToast(msg){
  const t=document.getElementById("toast");
  t.textContent=msg;t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>t.classList.remove("show"),2400);
}
