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
      isAuth=true;
      document.getElementById("pw-gate").style.display="none";
      document.getElementById("admin-panel").style.display="block";
      await Promise.all([renderAdminPrest(),renderAdminDocs(),renderAdminAvisos(),renderCatSelect()]);
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
  sel.innerHTML=`<option value="">— Selecione —</option>`;
  const cats=await loadCats();
  cats.forEach(c=>{sel.innerHTML+=`<option value="${c}">${c}</option>`;});
}
function formatPhone(p){const d=p.replace(/\D/g,"");if(d.length===11)return`(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;if(d.length===10)return`(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;return p;}
function maskPhone(input){let v=input.value.replace(/\D/g,"");if(v.length>11)v=v.slice(0,11);if(v.length<=10){v=v.replace(/(\d{2})(\d{4})(\d+)/,"($1) $2-$3").replace(/(\d{2})(\d+)/,"($1) $2");}else{v=v.replace(/(\d{2})(\d{5})(\d+)/,"($1) $2-$3");}input.value=v;}

async function renderAdminPrest(){
  const p=await loadProviders();
  document.getElementById("list-title-prest").innerHTML=`Prestadores <span class="badge-count">${p.length}</span>`;
  document.getElementById("admin-list-prest").innerHTML=p.length
    ?p.map(x=>`<div class="admin-item"><div class="admin-item-icon">${getIcon(x.category)}</div><div class="admin-item-info"><div class="admin-item-sub">${x.category}</div><div class="admin-item-name">${x.name}</div><div class="admin-item-detail">${formatPhone(x.phone)}</div></div><button class="del-btn" onclick="delProvider(${x.id})">🗑</button></div>`).join("")
    :`<div style="color:rgba(255,255,255,.4);text-align:center;padding:20px;font-size:13px;">Nenhum prestador.</div>`;
}
async function addProvider(){
  const name=document.getElementById("f-name").value.trim();
  const phone=document.getElementById("f-phone").value.replace(/\D/g,"");
  const category=document.getElementById("f-newcat").value.trim()||document.getElementById("f-cat").value;
  const note=document.getElementById("f-note").value.trim();
  if(!name||!phone||!category){showToast("⚠️ Preencha nome, telefone e categoria");return;}
  if(phone.length<10){showToast("⚠️ Telefone inválido");return;}
  showToast("⏳ Salvando…");
  const ok=await dbAddProvider({name,phone,category,note});
  if(!ok){showToast("❌ Erro ao salvar");return;}
  ["f-name","f-phone","f-newcat","f-note"].forEach(id=>document.getElementById(id).value="");
  document.getElementById("f-cat").value="";
  await renderAdminPrest();await renderCatSelect();await renderPublic();
  showToast("✅ Prestador adicionado!");
}
async function delProvider(id){
  if(!confirm("Remover este prestador?"))return;
  showToast("⏳ Removendo…");
  const ok=await dbDelProvider(id);
  if(!ok){showToast("❌ Erro ao remover");return;}
  await renderAdminPrest();await renderCatSelect();await renderPublic();
  showToast("🗑 Removido");
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
