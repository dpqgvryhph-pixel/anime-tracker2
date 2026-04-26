// Cloudflare Pages Function: GET/POST/PUT/DELETE /api/admin/users
// Felhasznalok kezelese - jogkorrel

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

  const SUPABASE_URL = env.SUPABASE_URL;
  const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return Response.json({ error: 'Supabase nincs konfigurálva' }, { status: 500, headers: CORS });
  }

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/users?select=id,username,display_name,role,created_at,last_login&order=created_at.desc`,
    { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
  );
  const data = await res.json().catch(() => []);
  return Response.json({ users: Array.isArray(data) ? data : [] }, { headers: CORS });
}

export async function onRequestPost({ request, env }) {
  const { isAuth } = getAuthFromCookies(request);
  if (!isAuth) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: CORS });

  const SUPABASE_URL = env.SUPABASE_URL;
  const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return Response.json({ error: 'Supabase nincs konfigurálva' }, { status: 500, headers: CORS });
  }

  let body;
  try { body = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400, headers: CORS }); }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  return Response.json({ success: res.ok, data }, { status: res.ok ? 200 : 400, headers: CORS });
}

export async function onRequestPut({ request, env }) {
  const { isAuth } = getAuthFromCookies(request);
  if (!isAuth) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: CORS });

  const SUPABASE_URL = env.SUPABASE_URL;
  const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return Response.json({ error: 'id parameter required' }, { status: 400, headers: CORS });

  let body;
  try { body = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400, headers: CORS }); }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return Response.json({ success: res.ok }, { headers: CORS });
}

export async function onRequestDelete({ request, env }) {
  const { isAuth } = getAuthFromCookies(request);
  if (!isAuth) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: CORS });

  const SUPABASE_URL = env.SUPABASE_URL;
  const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return Response.json({ error: 'id parameter required' }, { status: 400, headers: CORS });

  const res = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${id}`, {
    method: 'DELETE',
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` },
  });
  return Response.json({ success: res.ok }, { headers: CORS });
}
