// Cloudflare Pages Function: GET/POST/PUT/DELETE /api/admin/users
// Felhasznalok kezelese - jogkorrel D1 alapokon

const CORS = {
  'Access-Control-Allow-Origin': 'same-origin',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

function getAuthFromCookies(request) {
  const cookieHeader = request.headers.get('Cookie') || '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(c => c.trim().split('=').map(p => decodeURIComponent(p.trim())))
      .filter(([k]) => k)
  );
  const isAuth = !!(cookies['oni_auth'] && cookies['oni_auth'].length >= 10);
  const role = cookies['oni_role'] || null;
  return { isAuth, role };
}

export async function onRequestGet({ request, env }) {
  const { isAuth } = getAuthFromCookies(request);
  if (!isAuth) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: CORS });

  if (!env.DB) return Response.json({ error: 'Cloudflare D1 nincs csatolva' }, { status: 500, headers: CORS });

  try {
    const { results } = await env.DB.prepare(
      'SELECT id, username, display_name, role, created_at, last_login FROM users ORDER BY created_at DESC'
    ).all();
    return Response.json({ users: results || [] }, { headers: CORS });
  } catch (err) {
    return Response.json({ error: 'D1 hiba', detail: err.message }, { status: 500, headers: CORS });
  }
}

export async function onRequestPost({ request, env }) {
  const { isAuth } = getAuthFromCookies(request);
  if (!isAuth) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: CORS });

  if (!env.DB) return Response.json({ error: 'Cloudflare D1 nincs csatolva' }, { status: 500, headers: CORS });

  let body;
  try { body = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400, headers: CORS }); }

  try {
    const res = await env.DB.prepare(
      'INSERT INTO users (username, display_name, role) VALUES (?, ?, ?) RETURNING id, username, display_name, role'
    ).bind(body.username, body.display_name || null, body.role || 'viewer').first();
    
    return Response.json({ success: true, data: res }, { status: 200, headers: CORS });
  } catch (err) {
    return Response.json({ success: false, error: 'D1 hiba', detail: err.message }, { status: 400, headers: CORS });
  }
}

export async function onRequestPut({ request, env }) {
  const { isAuth } = getAuthFromCookies(request);
  if (!isAuth) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: CORS });

  if (!env.DB) return Response.json({ error: 'Cloudflare D1 nincs csatolva' }, { status: 500, headers: CORS });
  
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return Response.json({ error: 'id parameter required' }, { status: 400, headers: CORS });

  let body;
  try { body = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400, headers: CORS }); }

  try {
    if (body.last_login) {
      await env.DB.prepare('UPDATE users SET last_login = ? WHERE id = ?').bind(body.last_login, id).run();
    } else {
      await env.DB.prepare(
        'UPDATE users SET username = COALESCE(?, username), display_name = COALESCE(?, display_name), role = COALESCE(?, role) WHERE id = ?'
      ).bind(body.username || null, body.display_name || null, body.role || null, id).run();
    }
    return Response.json({ success: true }, { headers: CORS });
  } catch (err) {
    return Response.json({ success: false, error: 'D1 hiba', detail: err.message }, { status: 500, headers: CORS });
  }
}

export async function onRequestDelete({ request, env }) {
  const { isAuth } = getAuthFromCookies(request);
  if (!isAuth) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: CORS });

  if (!env.DB) return Response.json({ error: 'Cloudflare D1 nincs csatolva' }, { status: 500, headers: CORS });
  
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return Response.json({ error: 'id parameter required' }, { status: 400, headers: CORS });

  try {
    await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id).run();
    return Response.json({ success: true }, { headers: CORS });
  } catch (err) {
    return Response.json({ success: false, error: 'D1 hiba', detail: err.message }, { status: 500, headers: CORS });
  }
}
