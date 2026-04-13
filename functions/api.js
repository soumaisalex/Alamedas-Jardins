// functions/api.js
import { neon } from '@neondatabase/serverless';

export async function onRequest(context) {
  const sql = neon(context.env.DATABASE_URL);
  const { request } = context;
  const url = new URL(request.url);
  const path = url.searchParams.get('path');

  // Configurações de CORS para permitir que o front fale com a função
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json"
  };

  if (request.method === "OPTIONS") return new Response(null, { headers });

  try {
    // ROTA: Buscar Prestadores
    if (path === 'prestadores' && request.method === 'GET') {
      const result = await sql`SELECT * FROM prestadores ORDER BY nome ASC`;
      return new Response(JSON.stringify(result), { headers });
    }

    // ROTA: Buscar Avisos
    if (path === 'avisos' && request.method === 'GET') {
      const result = await sql`SELECT * FROM avisos ORDER BY id DESC`;
      return new Response(JSON.stringify(result), { headers });
    }

    // ROTA: Login Admin
    if (path === 'login' && request.method === 'POST') {
      const { password } = await request.json();
      const config = await sql`SELECT value FROM config WHERE key = 'admin_password' LIMIT 1`;
      const match = config[0]?.value === password;
      return new Response(JSON.stringify({ success: match }), { headers });
    }

    // ROTA: Adicionar Prestador
    if (path === 'add_prestador' && request.method === 'POST') {
      const { nome, telefone, categoria } = await request.json();
      await sql`INSERT INTO prestadores (nome, telefone, categoria) VALUES (${nome}, ${telefone}, ${categoria})`;
      return new Response(JSON.stringify({ success: true }), { headers });
    }

    return new Response("Rota não encontrada", { status: 404 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
}
