import { neon } from '@neondatabase/serverless';

export async function onRequest(context) {
  const sql = neon(context.env.DATABASE_URL);
  const { request } = context;
  const url = new URL(request.url);
  const path = url.searchParams.get('path');

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json"
  };

  if (request.method === "OPTIONS") return new Response(null, { headers });

  try {
    // ── CONSULTAS (GET) ──
    if (request.method === 'GET') {
      let result;
      if (path === 'prestadores') {
        result = await sql`SELECT id, name, phone, category FROM providers ORDER BY name ASC`;
      } else if (path === 'avisos') {
        result = await sql`SELECT id, title, body, type, date FROM notices ORDER BY id DESC`;
      } else if (path === 'docs') {
        result = await sql`SELECT id, name, url, type, description FROM documents ORDER BY name ASC`;
      }
      return new Response(JSON.stringify(result || []), { headers });
    }

    // ── OPERAÇÕES (POST) ──
    if (request.method === 'POST') {
      const body = await request.json();

      // Login: Verifica na tabela config
      if (path === 'login') {
        const config = await sql`SELECT value FROM config WHERE key = 'admin_password' LIMIT 1`;
        const isValid = config.length > 0 && config[0].value === body.password;
        return new Response(JSON.stringify({ success: isValid }), { headers });
      }

      // Adicionar Prestador
      if (path === 'add_prestador') {
        await sql`INSERT INTO providers (name, phone, category) VALUES (${body.name}, ${body.phone}, ${body.category})`;
        return new Response(JSON.stringify({ success: true }), { headers });
      }

      // Adicionar Aviso
      if (path === 'add_aviso') {
        await sql`INSERT INTO notices (title, body, type, date) VALUES (${body.title}, ${body.body}, ${body.type}, ${body.date})`;
        return new Response(JSON.stringify({ success: true }), { headers });
      }

      // Deletar Aviso
      if (path === 'del_aviso') {
        await sql`DELETE FROM notices WHERE id = ${body.id}`;
        return new Response(JSON.stringify({ success: true }), { headers });
      }
    }

    return new Response(JSON.stringify({ error: "Rota não encontrada" }), { status: 404, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
}
