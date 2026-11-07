// ══════ CLOUDFLARE DATA LAYER (Substitui o Supabase) ══════
async function loadProviders(){
  try {
    const res = await fetch(`${API}?path=prestadores`);
    const data = await res.json();
    // Traduz o retorno da API de volta para o inglês que o seu HTML usa
    return data.map(p => ({
      id: p.id,
      name: p.nome || p.name,
      phone: p.telefone || p.phone,
      category: p.categoria || p.category,
      note: p.note || ""
    }));
  } catch(e) { return []; }
}
async function loadDocs(){
  try {
    const res = await fetch(`${API}?path=docs`);
    const data = await res.json();
    return data.map(d => ({
      id: d.id, name: d.nome || d.name, url: d.url, 
      type: d.tipo || d.type, description: d.descricao || d.description || ""
    }));
  } catch(e) { return []; }
}
async function loadAvisos(){
  try {
    const res = await fetch(`${API}?path=avisos`);
    return await res.json();
  } catch(e) { return []; }
}

async function loadCats(){
  const p=await loadProviders();
  return[...new Set(p.map(x=>x.category))].filter(Boolean).sort();
}

async function loadCatIcons(){
  try {
    const d = await (await fetch(`${API}?path=cat_icons`)).json();
    CAT_OVERRIDES = {};
    if (Array.isArray(d)) d.forEach(x => { CAT_OVERRIDES[x.category.toLowerCase()] = x.icon; });
  } catch(e) {}
}

// POST autenticado (envia a senha do admin)
function adminPost(path, body){
  return fetch(`${API}?path=${path}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, password: adminPw })
  });
}

async function loadAdminProviders(){
  try {
    const d = await (await adminPost("admin_prestadores", {})).json();
    return Array.isArray(d) ? d : [];
  } catch(e) { return []; }
}

async function dbSignup(o){
  try {
    const res = await fetch(`${API}?path=cadastro_prestador`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: o.name, telefone: o.phone, categoria: o.category, note: o.note, website: o.website })
    });
    return await res.json();
  } catch(e) { return { success: false }; }
}

async function dbAddProvider(o){
  const res = await adminPost("add_prestador", { nome: o.name, telefone: o.phone, categoria: o.category, note: o.note });
  return res.ok;
}

async function dbDelProvider(id){ return (await adminPost("del_prestador", { id })).ok; }
async function dbApproveProvider(id){ return (await adminPost("aprovar_prestador", { id })).ok; }
async function dbRejectProvider(id){ return (await adminPost("rejeitar_prestador", { id })).ok; }
async function dbEditProvider(o){
  return (await adminPost("edit_prestador", { id: o.id, nome: o.name, telefone: o.phone, categoria: o.category, note: o.note })).ok;
}
async function dbSetCatIcon(categoria, icon){ return (await adminPost("set_cat_icon", { categoria, icon })).ok; }

async function dbAddDoc(o){
  const res = await fetch(`${API}?path=add_doc`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome: o.name, url: o.url, tipo: o.type, descricao: o.description })
  });
  return res.ok;
}

async function dbDelDoc(id){
  const res = await fetch(`${API}?path=del_doc`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id })
  });
  return res.ok;
}

async function dbAddAviso(o){
  const res = await fetch(`${API}?path=add_aviso`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(o)
  });
  return res.ok;
}

async function dbDelAviso(id){
  const res = await fetch(`${API}?path=del_aviso`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id })
  });
  return res.ok;
}

// ══════ ANALYTICS (Caseiro) ══════
function getDeviceType() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop';
}

function trackEvent(type, detail) {
  fetch(`${API}?path=track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, detail, device: getDeviceType() })
  }).catch(() => {}); 
}
