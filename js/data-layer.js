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
async function dbAddProvider(o){
  const res = await fetch(`${API}?path=add_prestador`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome: o.name, telefone: o.phone, categoria: o.category, note: o.note })
  });
  return res.ok;
}
async function dbDelProvider(id){
  const res = await fetch(`${API}?path=del_prestador`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id })
  });
  return res.ok;
}
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

