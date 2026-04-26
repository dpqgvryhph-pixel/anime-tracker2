// Cloudflare Pages Function: POST /api/sync
// Extension -> Cloudflare -> Supabase

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Oni-Token',
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestPost({ request, env }) {
  // 1. Token ellenőrzés
  const token = request.headers.get('X-Oni-Token');
  const validToken = env.EXTENSION_API_TOKEN;

  if (!validToken) {
    return Response.json({ error: 'EXTENSION_API_TOKEN nincs beállítva a Cloudflare env-ben' }, { status: 500, headers: CORS });
  }
  if (!token || token !== validToken) {
    return Response.json({ error: 'Unauthorized' }, { status: 401, headers: CORS });
  }

  // 2. Body parse
  let body;
  try { body = await request.json(); } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400, headers: CORS });
  }

  const { show_id, episode, anime_title } = body || {};
  if (typeof show_id !== 'number' || typeof episode !== 'number') {
    return Response.json({ error: 'show_id és episode kötelező (number)' }, { status: 400, headers: CORS });
  }

  // 3. Supabase hívás
  const SUPABASE_URL = env.SUPABASE_URL;
  const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return Response.json({ error: 'Supabase env vars hiányoznak' }, { status: 500, headers: CORS });
  }

  // RPC: increment_watched_count
  const rpcRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/increment_watched_count`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify({
      p_show_id: show_id,
      p_episode: episode,
      p_anime_title: anime_title || null,
    }),
  });

  const rpcText = await rpcRes.text();
  let rpcData;
  try { rpcData = JSON.parse(rpcText); } catch { rpcData = rpcText; }

  if (!rpcRes.ok) {
    console.error('[sync] Supabase RPC hiba:', rpcText);
    return Response.json({ error: 'Supabase RPC hiba', detail: rpcData }, { status: 500, headers: CORS });
  }

  return Response.json({ success: true, show_id, episode, data: rpcData }, { headers: CORS });
}
