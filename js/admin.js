// ══════ AUTH (Corrigido para Cloudflare) ══════
let isAuth=false;
async function checkPw(){
  const typed=document.getElementById("pw-input").value;
  if(!typed){return;}
  showToast("⏳ Verificando…");
  try{
    const res = await fetch(`${API}?path=login`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: typed })
    });
    const data = await res.json();
    if(data.success){
      isAuth=true;adminPw=typed;
      document.getElementById("pw-gate").style.display="none";
      document.getElementById("admin-panel").style.display="block";
      await Promise.all([renderAdminPrest(),renderAdminDocs(),renderAdminAvisos(),renderAdminStats(),renderCatSelect(),renderAdminIcons()]);
    }else{
      document.getElementById("pw-error").style.display="block";
      document.getElementById("pw-input").value="";
      document.getElementById("pw-input").focus();
    }
  }catch(e){showToast("❌ Erro de conexão");}
}

// ══════ ADMIN TABS ══════
function switchAdminTab(sec,btn){
  document.querySelectorAll(".admin-section").forEach(s=>s.classList.remove("active"));
  document.getElementById("asec-"+sec).classList.add("active");
  document.querySelectorAll(".admin-tab").forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");
}

// ══════ ADMIN PRESTADORES ══════
async function renderCatSelect(){
  const sel=document.getElementById("f-cat");
  const fb=document.getElementById("f-bloco");if(!fb.options.length)fb.innerHTML=blocoOptions(false);
  sel.innerHTML=`<option value="">— Selecione —</option>`;
  const cats=await loadCats();
  cats.forEach(c=>{sel.innerHTML+=`<option value="${c}">${c}</option>`;});
}
function formatPhone(p){const d=p.replace(/\D/g,"");if(d.length===11)return`(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;if(d.length===10)return`(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;return p;}
function maskPhone(input){let v=input.value.replace(/\D/g,"");if(v.length>11)v=v.slice(0,11);if(v.length<=10){v=v.replace(/(\d{2})(\d{4})(\d+)/,"($1) $2-$3").replace(/(\d{2})(\d+)/,"($1) $2");}else{v=v.replace(/(\d{2})(\d{5})(\d+)/,"($1) $2-$3");}input.value=v;}

let adminProvCache=[];
const btnStyle='style="background:rgba(74,140,92,.25);border-color:rgba(200,230,208,.3)"';
function provItem(x,pending){
  const actions=pending
    ?`<button class="del-btn" ${btnStyle} onclick="openEditProv(${x.id})">✏️</button><button class="del-btn" ${btnStyle} onclick="approveProv(${x.id})">✔</button><button class="del-btn" onclick="rejectProv(${x.id})">✕</button>`
    :`<button class="del-btn" ${btnStyle} onclick="openEditProv(${x.id})">✏️</button><button class="del-btn" onclick="delProvider(${x.id})">🗑</button>`;
  return `<div class="admin-item"><div class="admin-item-icon">${getIcon(x.category)}</div><div class="admin-item-info"><div class="admin-item-sub">${esc(x.category)}</div><div class="admin-item-name">${esc(x.name)}</div><div class="admin-item-detail">${x.bloco?"Bloco "+esc(x.bloco)+" · ":""}${esc(formatPhone(x.phone))}${x.note?" · "+esc(x.note):""}</div></div><div style="display:flex;gap:6px;">${actions}</div></div>`;
}
async function renderAdminPrest(){
  adminProvCache=await loadAdminProviders();
  const ok=adminProvCache.filter(x=>x.status!=="pendente");
  const pend=adminProvCache.filter(x=>x.status==="pendente");
  document.getElementById("list-title-prest").innerHTML=`Prestadores <span class="badge-count">${ok.length}</span>`;
  document.getElementById("admin-list-prest").innerHTML=ok.length
    ?ok.map(x=>provItem(x,false)).join("")
    :`<div style="color:rgba(255,255,255,.4);text-align:center;padding:20px;font-size:13px;">Nenhum prestador.</div>`;
  document.getElementById("list-title-pend").innerHTML=`Aguardando aprovação <span class="badge-count">${pend.length}</span>`;
  document.getElementById("admin-list-pend").innerHTML=pend.length
    ?pend.map(x=>provItem(x,true)).join("")
    :`<div style="color:rgba(255,255,255,.4);text-align:center;padding:20px;font-size:13px;">Nenhum cadastro pendente.</div>`;
  document.getElementById("pend-badge").innerHTML=pend.length?`<span class="badge-count">${pend.length}</span>`:"";
}
async function refreshProvAll(){
  await renderAdminPrest();await renderCatSelect();await renderAdminIcons();await renderPublic();
}
async function approveProv(id){
  showToast("⏳ Aprovando…");
  if(!await dbApproveProvider(id)){showToast("❌ Erro ao aprovar");return;}
  await refreshProvAll();showToast("✅ Prestador aprovado!");
}
async function rejectProv(id){
  if(!confirm("Rejeitar e apagar este cadastro?"))return;
  showToast("⏳ Removendo…");
  if(!await dbRejectProvider(id)){showToast("❌ Erro ao rejeitar");return;}
  await renderAdminPrest();showToast("🗑 Cadastro rejeitado");
}

// ── Editar prestador (modal) ──
function openEditProv(id){
  const x=adminProvCache.find(p=>String(p.id)===String(id));
  if(!x){showToast("⚠️ Prestador não encontrado");return;}
  document.getElementById("e-id").value=x.id;
  document.getElementById("e-name").value=x.name;
  document.getElementById("e-phone").value=formatPhone(x.phone);
  document.getElementById("e-note").value=x.note||"";
  const bl=document.getElementById("e-bloco");
  bl.innerHTML=blocoOptions(false);bl.value=x.bloco||"";
  const cats=[...new Set(adminProvCache.filter(p=>p.status!=="pendente").map(p=>p.category).concat(x.category))].filter(Boolean).sort();
  cpInit("e",cats,x.category);
  document.getElementById("edit-modal").classList.add("show");
}
function closeEditProv(){document.getElementById("edit-modal").classList.remove("show");}
async function saveEditProv(){
  const id=document.getElementById("e-id").value;
  const name=document.getElementById("e-name").value.trim();
  const phone=document.getElementById("e-phone").value.replace(/\D/g,"");
  const category=document.getElementById("e-cat").value;
  const bloco=document.getElementById("e-bloco").value;
  const note=document.getElementById("e-note").value.trim();
  if(!name||!phone||!category){showToast("⚠️ Preencha nome, telefone e categoria");return;}
  if(phone.length<10){showToast("⚠️ Telefone inválido");return;}
  showToast("⏳ Salvando…");
  if(!await dbEditProvider({id,name,phone,category,bloco,note})){showToast("❌ Erro ao salvar");return;}
  closeEditProv();await refreshProvAll();showToast("✅ Prestador atualizado!");
}

// ── Categorias: nome + ícone ──
async function renderAdminIcons(){
  await loadCatIcons();
  const cats=await loadCats();
  document.getElementById("admin-list-icons").innerHTML=cats.length
    ?cats.map((c,i)=>`<div class="admin-item"><div class="admin-item-icon">${getIcon(c)}</div><div class="admin-item-info"><input class="name-input" id="cn-${i}" data-cat="${esc(c)}" maxlength="40" value="${esc(c)}"></div><input class="icon-input" id="ico-${i}" maxlength="10" value="${esc(CAT_OVERRIDES[c.toLowerCase()]||"")}" placeholder="${defaultIcon(c)}"><button class="del-btn" ${btnStyle} onclick="saveCatIcon(${i})">💾</button></div>`).join("")
    :`<div style="color:rgba(255,255,255,.4);text-align:center;padding:20px;font-size:13px;">Nenhuma categoria.</div>`;
}
async function saveCatIcon(i){
  const nameEl=document.getElementById("cn-"+i);
  const old=nameEl.dataset.cat;
  const novo=nameEl.value.trim();
  const icon=document.getElementById("ico-"+i).value.trim();
  if(!novo){showToast("⚠️ Informe o nome da categoria");return;}
  const renamed=novo!==old;
  if(renamed){
    const exists=(await loadCats()).some(c=>c!==old&&c.toLowerCase()===novo.toLowerCase());
    if(exists&&!confirm("Já existe uma categoria com esse nome. Juntar os prestadores nela?"))return;
  }
  showToast("⏳ Salvando…");
  if(renamed&&!await dbRenameCat(old,novo)){showToast("❌ Erro ao renomear");return;}
  if(!await dbSetCatIcon(novo,icon)){showToast("❌ Erro ao salvar");return;}
  if(renamed&&activeCategory===old)activeCategory=null;
  await refreshProvAll();
  showToast("✅ Categoria atualizada!");
}

async function addProvider(){
  const name=document.getElementById("f-name").value.trim();
  const phone=document.getElementById("f-phone").value.replace(/\D/g,"");
  const category=document.getElementById("f-newcat").value.trim()||document.getElementById("f-cat").value;
  const bloco=document.getElementById("f-bloco").value;
  const note=document.getElementById("f-note").value.trim();
  if(!name||!phone||!category){showToast("⚠️ Preencha nome, telefone e categoria");return;}
  if(phone.length<10){showToast("⚠️ Telefone inválido");return;}
  showToast("⏳ Salvando…");
  const ok=await dbAddProvider({name,phone,category,note,bloco});
  if(!ok){showToast("❌ Erro ao salvar");return;}
  ["f-name","f-phone","f-newcat","f-note"].forEach(id=>document.getElementById(id).value="");
  document.getElementById("f-cat").value="";
  await refreshProvAll();
  showToast("✅ Prestador adicionado!");
}
async function delProvider(id){
  if(!confirm("Remover este prestador?"))return;
  showToast("⏳ Removendo…");
  const ok=await dbDelProvider(id);
  if(!ok){showToast("❌ Erro ao remover");return;}
  await refreshProvAll();
  showToast("🗑 Removido");
}

// ══════ ESTATISTICAS ══════
async function renderAdminStats() {
  const container = document.getElementById("admin-list-stats");
  container.innerHTML = `<div class="loading">Carregando dados...</div>`;
  
  try {
    const stats = await fetch(`${API}?path=stats`).then(r => r.json());
    
    // Funçãozinha para desenhar as barrinhas
    const drawList = (arr) => arr.length ? arr.map(i => `
      <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid rgba(255,255,255,0.1);">
        <span style="color:var(--cream); text-transform: capitalize;">${i.event_detail || i.device_type}</span>
        <strong style="color:var(--green-light)">${i.count}</strong>
      </div>
    `).join('') : '<small style="color:#aaa">Sem dados ainda.</small>';

    container.innerHTML = `
      <div class="admin-form-card" style="margin-bottom:15px; text-align:center;">
        <h2 style="margin:0; font-size:32px; color:var(--green-light)">${stats.total}</h2>
        <p style="margin:0; font-size:12px; color:#aaa">Interações totais capturadas</p>
      </div>

      <div class="admin-form-card" style="margin-bottom:15px;">
        <div class="form-title">📱 Dispositivos</div>
        ${drawList(stats.devices)}
      </div>

      <div class="admin-form-card" style="margin-bottom:15px;">
        <div class="form-title">🏆 Top Abas Acessadas</div>
        ${drawList(stats.topTabs)}
      </div>

      <div class="admin-form-card" style="margin-bottom:15px;">
        <div class="form-title">💬 Top WhatsApp (Prestadores)</div>
        ${drawList(stats.topClicks)}
      </div>
      
      <div class="admin-form-card" style="margin-bottom:15px;">
        <div class="form-title">📄 Top Documentos Acessados</div>
        ${drawList(stats.topDocs)}
      </div>
    `;
  } catch (e) {
    container.innerHTML = `<div style="color:red">Erro ao carregar estatísticas.</div>`;
  }
}

// ══════ ADMIN DOCUMENTOS ══════
async function renderAdminDocs(){
  const docs=await loadDocs();
  document.getElementById("list-title-docs").innerHTML=`Documentos <span class="badge-count">${docs.length}</span>`;
  document.getElementById("admin-list-docs").innerHTML=docs.length
    ?docs.map(d=>`<div class="admin-item"><div class="admin-item-icon">${d.type==="pdf"?"📄":"🔗"}</div><div class="admin-item-info"><div class="admin-item-sub">${d.type==="pdf"?"PDF":"Link"}</div><div class="admin-item-name">${d.name}</div><div class="admin-item-detail">${d.description||d.url}</div></div><button class="del-btn" onclick="delDoc(${d.id})">🗑</button></div>`).join("")
    :`<div style="color:rgba(255,255,255,.4);text-align:center;padding:20px;font-size:13px;">Nenhum documento.</div>`;
}
async function addDoc(){
  const name=document.getElementById("d-name").value.trim();
  const url=document.getElementById("d-url").value.trim();
  const type=document.getElementById("d-type").value;
  const description=document.getElementById("d-desc").value.trim();
  if(!name||!url){showToast("⚠️ Preencha nome e URL");return;}
  showToast("⏳ Salvando…");
  const ok=await dbAddDoc({name,url,type,description});
  if(!ok){showToast("❌ Erro ao salvar");return;}
  ["d-name","d-url","d-desc"].forEach(id=>document.getElementById(id).value="");
  await renderAdminDocs();await renderDocs();
  showToast("✅ Documento adicionado!");
}
async function delDoc(id){
  if(!confirm("Remover este documento?"))return;
  showToast("⏳ Removendo…");
  const ok=await dbDelDoc(id);
  if(!ok){showToast("❌ Erro ao remover");return;}
  await renderAdminDocs();await renderDocs();
  showToast("🗑 Removido");
}

// ══════ ADMIN AVISOS ══════
async function renderAdminAvisos(){
  const av=await loadAvisos();
  document.getElementById("list-title-avisos").innerHTML=`Avisos <span class="badge-count">${av.length}</span>`;
  const typeLabel={info:"ℹ️ Info",alerta:"⚠️ Alerta",urgente:"🚨 Urgente"};
  document.getElementById("admin-list-avisos").innerHTML=av.length
    ?av.map(a=>`<div class="admin-item"><div class="admin-item-icon">${a.type==="urgente"?"🚨":a.type==="alerta"?"⚠️":"ℹ️"}</div><div class="admin-item-info"><div class="admin-item-sub">${typeLabel[a.type]||""} · ${a.date}</div><div class="admin-item-name">${a.title}</div><div class="admin-item-detail">${a.body.slice(0,60)}${a.body.length>60?"…":""}</div></div><button class="del-btn" onclick="delAviso(${a.id})">🗑</button></div>`).join("")
    :`<div style="color:rgba(255,255,255,.4);text-align:center;padding:20px;font-size:13px;">Nenhum aviso.</div>`;
}
async function addAviso(){
  const title=document.getElementById("av-title").value.trim();
  const body=document.getElementById("av-body").value.trim();
  const type=document.getElementById("av-type").value;
  if(!title||!body){showToast("⚠️ Preencha título e mensagem");return;}
  const date=new Date().toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric"});
  showToast("⏳ Publicando…");
  const ok=await dbAddAviso({title,body,type,date});
  if(!ok){showToast("❌ Erro ao publicar");return;}
  ["av-title","av-body"].forEach(id=>document.getElementById(id).value="");
  await renderAdminAvisos();await renderAvisos();
  showToast("✅ Aviso publicado!");
}
async function delAviso(id){
  if(!confirm("Remover este aviso?"))return;
  showToast("⏳ Removendo…");
  const ok=await dbDelAviso(id);
  if(!ok){showToast("❌ Erro ao remover");return;}
  await renderAdminAvisos();await renderAvisos();
  showToast("🗑 Removido");
}
