import { neon } from '@neondatabase/serverless'; // ou de 'https://esm.sh/...' se usou a opção 2

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
    // GET: Listagem Geral
    if (request.method === 'GET') {
      let result;
      if (path === 'prestadores') {
        // Busca de 'providers' e renomeia as colunas para o HTML entender
        result = await sql`SELECT id, name AS nome, phone AS telefone, category AS categoria FROM providers ORDER BY name ASC`;
      }
      if (path === 'avisos') {
        // Notices já usa title, body, date, type, então não precisa renomear
        result = await sql`SELECT * FROM notices ORDER BY id DESC`;
      }
      if (path === 'docs') {
        result = await sql`SELECT id, name AS nome, url, type AS tipo, description AS descricao FROM documents ORDER BY name ASC`;
      }
      return new Response(JSON.stringify(result || []), { headers });
    }

    // POST: Operações de Escrita e Login
    if (request.method === 'POST') {
      const body = await request.json();

      if (path === 'login') {
        const config = await sql`SELECT value FROM config WHERE key = 'admin_password' LIMIT 1`;
        return new Response(JSON.stringify({ success: config[0]?.value === body.password }), { headers });
      }

      if (path === 'add_prestador') {
        // Insere na tabela 'providers' usando os dados que vêm do front-end
        await sql`INSERT INTO providers (name, phone, category) VALUES (${body.nome}, ${body.telefone}, ${body.categoria})`;
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
    }

    return new Response(JSON.stringify({ error: "Rota não encontrada" }), { status: 404, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
}
