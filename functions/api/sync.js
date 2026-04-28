// Cloudflare Pages Function: GET/POST /api/sync
// Extension -> Cloudflare D1 (Auth via Basic Auth / Username + Password)

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Oni-Token',
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

function verifyAuth(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Basic ')) return false;

  const base64Credentials = authHeader.split(' ')[1];
  let credentials;
  try {
    credentials = atob(base64Credentials);
  } catch {
    return false;
  }

  const [username, password] = credentials.split(':');

  let users = [];
  if (env.USERS_JSON) {
    try { users = JSON.parse(env.USERS_JSON); } catch { users = []; }
  }
  if (users.length === 0 && env.ADMIN_USERNAME && env.ADMIN_PASSWORD) {
    users = [{ username: env.ADMIN_USERNAME, password: env.ADMIN_PASSWORD, role: 'superadmin' }];
  }
  if (users.length === 0) {
    users = [{ username: 'admin', password: 'admin', role: 'superadmin' }];
  }

  const user = users.find(u => u.username === username && u.password === password);
  return !!user;
}

export async function onRequestGet({ request, env }) {
  if (!verifyAuth(request, env)) {
    return Response.json({ error: 'Unauthorized (Hibás jelszó vagy felhasználónév)' }, { status: 401, headers: CORS });
  }

  const url = new URL(request.url);
  const show_id = url.searchParams.get('show_id');
  const episode = url.searchParams.get('episode');

  if (!show_id || !episode) {
    return Response.json({ error: 'show_id és episode kötelező' }, { status: 400, headers: CORS });
  }

  if (!env.DB) return Response.json({ error: 'Cloudflare D1 nincs csatolva' }, { status: 500, headers: CORS });

  try {
    const existing = await env.DB.prepare(
      'SELECT * FROM watched_episodes WHERE show_id = ? AND episode = ?'
    ).bind(Number(show_id), Number(episode)).first();

    if (existing) {
      return Response.json({ watched: true, data: existing }, { headers: CORS });
    } else {
      return Response.json({ watched: false }, { headers: CORS });
    }
  } catch (err) {
    return Response.json({ error: 'D1 hiba', detail: err.message }, { status: 500, headers: CORS });
  }
}

export async function onRequestPost({ request, env }) {
  if (!verifyAuth(request, env)) {
    return Response.json({ error: 'Unauthorized (Hibás jelszó vagy felhasználónév)' }, { status: 401, headers: CORS });
  }

  let body;
  try { body = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400, headers: CORS }); }

  const { show_id, episode, anime_title, duration_minutes } = body || {};
  if (typeof show_id !== 'number' || typeof episode !== 'number') {
    return Response.json({ error: 'show_id és episode kötelező (number)' }, { status: 400, headers: CORS });
  }

  const duration = duration_minutes || 24;

  if (!env.DB) return Response.json({ error: 'Cloudflare D1 nincs csatolva' }, { status: 500, headers: CORS });

  try {
    const existing = await env.DB.prepare(
      'SELECT id, watched_count FROM watched_episodes WHERE show_id = ? AND episode = ?'
    ).bind(show_id, episode).first();

    let rpcData = null;
    const now = new Date().toISOString();

    if (existing) {
      await env.DB.prepare(
        'UPDATE watched_episodes SET watched_count = watched_count + 1, last_watched = ?, anime_title = COALESCE(?, anime_title) WHERE id = ?'
      ).bind(now, anime_title || null, existing.id).run();
      rpcData = { id: existing.id, watched_count: existing.watched_count + 1 };
    } else {
      const res = await env.DB.prepare(
        'INSERT INTO watched_episodes (show_id, episode, anime_title, watched_count, duration_minutes, first_watched, last_watched) VALUES (?, ?, ?, 1, ?, ?, ?)'
      ).bind(show_id, episode, anime_title || null, duration, now, now).run();
      rpcData = { id: res.meta.last_row_id, watched_count: 1 };
    }

    return Response.json({ success: true, show_id, episode, data: rpcData }, { headers: CORS });
  } catch (err) {
    return Response.json({ error: 'D1 hiba', detail: err.message }, { status: 500, headers: CORS });
  }
}
