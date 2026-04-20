// ══════ TAB NAVIGATION ══════
const TABS=["prestadores","documentos","apps","avisos"];
function switchTab(tab,btn){
  TABS.forEach(t=>document.getElementById("tab-"+t).classList.toggle("active",t===tab));
  document.querySelectorAll(".tab-btn").forEach(b=>b.classList.remove("active"));
  if(btn)btn.classList.add("active");
  document.getElementById("admin-fab").style.display="flex";
  if(tab==="prestadores")renderPublic();
  if(tab==="documentos")renderDocs();
  if(tab==="avisos")renderAvisos();
  window.scrollTo(0,0);
}

// ══════ PRESTADORES ══════
let activeCategory=null;
async function renderPublic(){await renderCategories();await renderCards();}

async function renderCategories(){
  const wrap=document.getElementById("cats-wrap");
  const cats=await loadCats();
  wrap.innerHTML=`<div class="cat-chip ${!activeCategory?"active":""}" onclick="filterCat(null)">Todos</div>`;
  cats.forEach(cat=>{
    const c=document.createElement("div");
    c.className="cat-chip"+(activeCategory===cat?" active":"");
    c.textContent=getIcon(cat)+" "+cat;
    c.onclick=()=>filterCat(cat);
    wrap.appendChild(c);
  });
}

async function filterCat(cat){
  activeCategory=cat;
  document.getElementById("search-input").value="";
  document.getElementById("clear-btn").style.display="none";
  await renderCategories();await renderCards();
}

async function renderCards(q=""){
  const grid=document.getElementById("cards-grid");
  const empty=document.getElementById("empty-state");
  const info=document.getElementById("results-info");
  grid.innerHTML=`<div class="loading">Carregando…</div>`;
  let p=await loadProviders();
  if(activeCategory)p=p.filter(x=>x.category===activeCategory);
  if(q){const lq=q.toLowerCase();p=p.filter(x=>x.name.toLowerCase().includes(lq)||x.category.toLowerCase().includes(lq)||(x.note||"").toLowerCase().includes(lq));}
  if(!p.length){grid.innerHTML="";empty.style.display="block";info.textContent="";return;}
  empty.style.display="none";
  info.textContent=p.length===1?"1 resultado":`${p.length} resultados`;
  grid.innerHTML=p.map((x,i)=>{
    const wa=x.phone.replace(/\D/g,"");
    return`<div class="svc-card" style="animation-delay:${i*.03}s">
      <div class="card-avatar">${getIcon(x.category)}</div>
      <div class="card-info">
        <div class="card-category">${x.category}</div>
        <div class="card-name">${x.name}</div>
        ${x.note?`<div class="card-note">${x.note}</div>`:""}
      </div>
      <a class="card-wa" href="https://wa.me/55${wa}" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      </a>
    </div>`;
  }).join("");
}

document.getElementById("search-input").addEventListener("input",async function(){
  const q=this.value.trim();
  document.getElementById("clear-btn").style.display=q?"block":"none";
  activeCategory=null;await renderCategories();await renderCards(q);
});
async function clearSearch(){
  document.getElementById("search-input").value="";
  document.getElementById("clear-btn").style.display="none";
  await renderCards();
}

// ══════ DOCUMENTOS ══════
async function renderDocs(){
  const grid=document.getElementById("docs-grid");
  grid.innerHTML=`<div class="loading">Carregando…</div>`;
  const docs=await loadDocs();
  if(!docs.length){grid.innerHTML=`<div style="text-align:center;padding:40px 20px;color:var(--text-soft);">Nenhum documento cadastrado.</div>`;return;}
  grid.innerHTML=docs.map((d,i)=>{
    const isPdf=d.type==="pdf";
    return`<a class="doc-card" href="${d.url}" target="_blank" rel="noopener" style="animation-delay:${i*.05}s">
      <div class="doc-icon ${isPdf?"":"link-type"}">${isPdf?"📄":"🔗"}</div>
      <div class="doc-info">
        <div class="doc-cat ${isPdf?"":"link-cat"}">${isPdf?"PDF":"Link"}</div>
        <div class="doc-name">${d.name}</div>
        ${d.description?`<div class="doc-desc">${d.description}</div>`:""}
      </div>
      <div class="doc-action">${isPdf?"⬇️":"›"}</div>
    </a>`;
  }).join("");
}

// ══════ AVISOS ══════
async function renderAvisos(){
  const grid=document.getElementById("avisos-grid");
  const noAv=document.getElementById("no-avisos");
  grid.innerHTML=`<div class="loading">Carregando…</div>`;
  const avisos=await loadAvisos();
  if(!avisos.length){grid.innerHTML="";noAv.style.display="block";return;}
  noAv.style.display="none";
  const typeLabel={info:"ℹ️ Informação",alerta:"⚠️ Alerta",urgente:"🚨 Urgente"};
  grid.innerHTML=avisos.map((av,i)=>`
    <div class="aviso-card" style="animation-delay:${i*.05}s">
      <div class="aviso-header">
        <span class="aviso-badge ${av.type}">${typeLabel[av.type]||"ℹ️"}</span>
        <span class="aviso-date">${av.date}</span>
      </div>
      <div class="aviso-title">${av.title}</div>
      <div class="aviso-body">${av.body}</div>
    </div>`).join("");
}

// ══════ WIFI ══════
function copyWifi(pass,btn){
  navigator.clipboard.writeText(pass).then(()=>{
    const orig=btn.textContent;btn.textContent="Copiado!";
    setTimeout(()=>btn.textContent=orig,1800);
  }).catch(()=>{btn.textContent="Copie: "+pass;});
}

// ══════ NAVIGATION ══════
function goAdmin(){
  TABS.forEach(t=>document.getElementById("tab-"+t).classList.remove("active"));
  document.getElementById("page-admin").classList.add("active");
  document.getElementById("tabbar").style.display="none";
  document.getElementById("admin-fab").style.display="none";
  window.scrollTo(0,0);
}
function goPublic(){
  document.getElementById("page-admin").classList.remove("active");
  document.getElementById("tabbar").style.display="flex";
  document.getElementById("admin-fab").style.display="flex";
  isAuth=false;
  document.getElementById("pw-gate").style.display="block";
  document.getElementById("admin-panel").style.display="none";
  document.getElementById("pw-input").value="";
  document.getElementById("pw-error").style.display="none";
  window.scrollTo(0,0);
  switchTab("prestadores",document.querySelector(".tab-btn"));
}

