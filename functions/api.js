import { neon } from '@neondatabase/serverless';

async function isAdmin(sql, pw) {
  if (!pw) return false;
  const c = await sql`SELECT value FROM config WHERE key = 'admin_password' LIMIT 1`;
  return c.length > 0 && c[0].value === pw;
}

const ADMIN_PATHS = ['admin_prestadores','aprovar_prestador','rejeitar_prestador','edit_prestador','set_cat_icon','rename_cat','add_prestador','del_prestador'];

export async function onRequest(context) {
  const sql = neon(context.env.DATABASE_URL);
  const { request } = context;
  const url = new URL(request.url);
  const path = url.searchParams.get('path');

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  if (request.method === "OPTIONS") return new Response(null, { headers });

  try {
// ── LEITURA (GET) ──
    if (request.method === 'GET') {
      let result;
      
      if (path === 'prestadores') {
        // Alinhado com p.nome, p.telefone, p.categoria do seu HTML
        result = await sql`SELECT id, name AS nome, phone AS telefone, category AS categoria, note FROM providers WHERE status = 'aprovado' ORDER BY name ASC`;
      } else if (path === 'cat_icons') {
        result = await sql`SELECT category, icon FROM category_icons`;
      } else if (path === 'avisos') {
        result = await sql`SELECT * FROM notices ORDER BY id DESC`;
      } else if (path === 'docs') {
        // Alinhado com d.nome, d.descricao, d.tipo do seu HTML
        result = await sql`SELECT id, name AS nome, url, type AS tipo, description AS descricao FROM documents ORDER BY name ASC`;
      } else if (path === 'stats') {
        // Novo bloco de estatísticas encaixado aqui!
        const total = await sql`SELECT COUNT(*) as count FROM analytics`;
        const topTabs = await sql`SELECT event_detail, COUNT(*) as count FROM analytics WHERE event_type = 'aba_acessada' GROUP BY event_detail ORDER BY count DESC LIMIT 5`;
        const topClicks = await sql`SELECT event_detail, COUNT(*) as count FROM analytics WHERE event_type = 'clique_whatsapp' GROUP BY event_detail ORDER BY count DESC LIMIT 5`;
        const topSearches = await sql`SELECT event_detail, COUNT(*) as count FROM analytics WHERE event_type = 'busca' AND event_detail != '' GROUP BY event_detail ORDER BY count DESC LIMIT 5`;
        const devices = await sql`SELECT device_type, COUNT(*) as count FROM analytics GROUP BY device_type`;
        const topDocs = await sql`SELECT event_detail, COUNT(*) as count FROM analytics WHERE event_type = 'documento_baixado' GROUP BY event_detail ORDER BY count DESC LIMIT 5`;

        result = { 
          total: total[0].count, 
          topTabs, topClicks, topSearches, devices, topDocs
        };
      }
      
      return new Response(JSON.stringify(result || []), { headers });
    }

    // ── ESCRITA E LOGIN (POST) ──
    if (request.method === 'POST') {
      const body = await request.json();

      if (ADMIN_PATHS.includes(path) && !(await isAdmin(sql, body.password))) {
        return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers });
      }

      if (path === 'login') {
        const config = await sql`SELECT value FROM config WHERE key = 'admin_password' LIMIT 1`;
        const success = config.length > 0 && config[0].value === body.password;
        return new Response(JSON.stringify({ success }), { headers });
      }

      if (path === 'add_prestador') {
        await sql`INSERT INTO providers (name, phone, category, note, bloco, status) VALUES (${body.nome}, ${body.telefone}, ${body.categoria}, ${body.note || ''}, ${String(body.bloco || '')}, 'aprovado')`;
        return new Response(JSON.stringify({ success: true }), { headers });
      }

      // ── CADASTRO PÚBLICO (fica pendente até aprovação) ──
      if (path === 'cadastro_prestador') {
        if (body.website) return new Response(JSON.stringify({ success: true }), { headers }); // honeypot anti-bot
        const nome = String(body.nome || '').trim().slice(0, 80);
        const telefone = String(body.telefone || '').replace(/\D/g, '');
        const categoria = String(body.categoria || '').trim().slice(0, 40);
        const note = String(body.note || '').trim().slice(0, 160);
        // bloco: "nao" = não mora no Alamedas (fica vazio); senão 1 a 26
        const blocoRaw = String(body.bloco ?? '').trim();
        let bloco = '';
        let blocoOk = blocoRaw === 'nao';
        if (!blocoOk) {
          const n = Number(blocoRaw);
          if (Number.isInteger(n) && n >= 1 && n <= 26) { bloco = String(n); blocoOk = true; }
        }
        if (!nome || !categoria || !blocoOk || telefone.length < 10 || telefone.length > 11) {
          return new Response(JSON.stringify({ success: false, error: 'invalido' }), { status: 400, headers });
        }
        const catOk = await sql`SELECT 1 FROM providers WHERE category = ${categoria} AND status = 'aprovado' LIMIT 1`;
        if (!catOk.length) return new Response(JSON.stringify({ success: false, error: 'categoria' }), { status: 400, headers });
        const dup = await sql`SELECT 1 FROM providers WHERE phone = ${telefone} LIMIT 1`;
        if (dup.length) return new Response(JSON.stringify({ success: false, error: 'duplicado' }), { headers });
        const pend = await sql`SELECT COUNT(*) AS c FROM providers WHERE status = 'pendente'`;
        if (Number(pend[0].c) >= 50) return new Response(JSON.stringify({ success: false, error: 'limite' }), { headers });
        await sql`INSERT INTO providers (name, phone, category, note, bloco, status) VALUES (${nome}, ${telefone}, ${categoria}, ${note}, ${bloco}, 'pendente')`;
        return new Response(JSON.stringify({ success: true }), { headers });
      }

      // ── ADMIN: prestadores ──
      if (path === 'admin_prestadores') {
        const rows = await sql`SELECT id, name, phone, category, note, bloco, status FROM providers ORDER BY name ASC`;
        return new Response(JSON.stringify(rows), { headers });
      }
      if (path === 'aprovar_prestador') {
        await sql`UPDATE providers SET status = 'aprovado' WHERE id = ${body.id}`;
        return new Response(JSON.stringify({ success: true }), { headers });
      }
      if (path === 'rejeitar_prestador') {
        await sql`DELETE FROM providers WHERE id = ${body.id} AND status = 'pendente'`;
        return new Response(JSON.stringify({ success: true }), { headers });
      }
      if (path === 'edit_prestador') {
        await sql`UPDATE providers SET name = ${body.nome}, phone = ${body.telefone}, category = ${body.categoria}, note = ${body.note || ''}, bloco = ${String(body.bloco || '')} WHERE id = ${body.id}`;
        return new Response(JSON.stringify({ success: true }), { headers });
      }
      if (path === 'rename_cat') {
        const de = String(body.de || ''), para = String(body.para || '').trim().slice(0, 40);
        if (!de || !para) return new Response(JSON.stringify({ success: false }), { status: 400, headers });
        if (de !== para) {
          await sql`UPDATE providers SET category = ${para} WHERE category = ${de}`;
          const ex = await sql`SELECT 1 FROM category_icons WHERE category = ${para}`;
          if (ex.length) await sql`DELETE FROM category_icons WHERE category = ${de}`;
          else await sql`UPDATE category_icons SET category = ${para} WHERE category = ${de}`;
        }
        return new Response(JSON.stringify({ success: true }), { headers });
      }
      if (path === 'set_cat_icon') {
        const icon = String(body.icon || '').trim().slice(0, 16);
        if (!icon) {
          await sql`DELETE FROM category_icons WHERE category = ${body.categoria}`;
        } else {
          await sql`INSERT INTO category_icons (category, icon) VALUES (${body.categoria}, ${icon}) ON CONFLICT (category) DO UPDATE SET icon = EXCLUDED.icon`;
        }
        return new Response(JSON.stringify({ success: true }), { headers });
      }

      if (path === 'add_aviso') {
        await sql`INSERT INTO notices (title, body, type, date) VALUES (${body.title}, ${body.body}, ${body.type}, ${body.date})`;
        return new Response(JSON.stringify({ success: true }), { headers });
      }

      if (path === 'del_aviso') {
        await sql`DELETE FROM notices WHERE id = ${body.id}`;
        return new Response(JSON.stringify({ success: true }), { headers });
      }
      if (path === 'del_prestador') {
        await sql`DELETE FROM providers WHERE id = ${body.id}`;
        return new Response(JSON.stringify({ success: true }), { headers });
      }
      
      if (path === 'add_doc') {
        await sql`INSERT INTO documents (name, url, type, description) VALUES (${body.nome}, ${body.url}, ${body.tipo}, ${body.descricao})`;
        return new Response(JSON.stringify({ success: true }), { headers });
      }

      if (path === 'del_doc') {
        await sql`DELETE FROM documents WHERE id = ${body.id}`;
        return new Response(JSON.stringify({ success: true }), { headers });
      }

      if (path === 'track') {
        const type = body.type || 'unknown';
        const detail = body.detail || '';
        const device = body.device || 'Desktop';
        await sql`INSERT INTO analytics (event_type, event_detail, device_type) VALUES (${type}, ${detail}, ${device})`;
        return new Response(JSON.stringify({ success: true }), { headers });
      }
    }

    return new Response(JSON.stringify({ error: "Rota não encontrada" }), { status: 404, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
}
