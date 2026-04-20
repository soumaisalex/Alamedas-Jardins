import { neon } from '@neondatabase/serverless';

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
        result = await sql`SELECT id, name AS nome, phone AS telefone, category AS categoria, note FROM providers ORDER BY name ASC`;
      } else if (path === 'avisos') {
        result = await sql`SELECT * FROM notices ORDER BY id DESC`;
      } else if (path === 'docs') {
        // Alinhado com d.nome, d.descricao, d.tipo do seu HTML
        result = await sql`SELECT id, name AS nome, url, type AS tipo, description AS descricao FROM documents ORDER BY name ASC`;
      }
      return new Response(JSON.stringify(result || []), { headers });
    }

    // ── ESCRITA E LOGIN (POST) ──
    if (request.method === 'POST') {
      const body = await request.json();

      if (path === 'login') {
        const config = await sql`SELECT value FROM config WHERE key = 'admin_password' LIMIT 1`;
        const success = config.length > 0 && config[0].value === body.password;
        return new Response(JSON.stringify({ success }), { headers });
      }

      if (path === 'add_prestador') {
        await sql`INSERT INTO providers (name, phone, category, note) VALUES (${body.nome}, ${body.telefone}, ${body.categoria}, ${body.note || ''})`;
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
    }

    return new Response(JSON.stringify({ error: "Rota não encontrada" }), { status: 404, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
}
