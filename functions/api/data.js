// Cloudflare Pages Function: GET /api/data
// Dashboard adatok lekérése Supabase-ből

export async function onRequestGet({ request, env }) {
  // Auth ellenőrzés cookie alapján
  const cookieHeader = request.headers.get('Cookie') || '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(c => c.trim().split('=').map(p => decodeURIComponent(p.trim())))
      .filter(([k]) => k)
  );

  if (!cookies['oni_auth'] || cookies['oni_auth'].length < 10) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const SUPABASE_URL = env.SUPABASE_URL;
  const SUPABASE_KEY = env.SUPABASE_ANON_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return Response.json({ error: 'Supabase nincs konfigurálva' }, { status: 500 });
  }

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/watched_episodes?select=*&order=last_watched.desc`,
    {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
    }
  );

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = []; }

  if (!res.ok) {
    return Response.json({ error: 'Supabase hiba', detail: data }, { status: 500 });
  }

  return Response.json({ data });
}
