// Cloudflare Pages Function: GET /api/admin/stats
// Admin statisztikak: osszesitett adatok

const CORS = {
  'Access-Control-Allow-Origin': 'same-origin',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestGet({ request, env }) {
  // Auth ellenorzese cookie alapjan
  const cookieHeader = request.headers.get('Cookie') || '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(c => c.trim().split('=').map(p => decodeURIComponent(p.trim())))
      .filter(([k]) => k)
  );

  if (!cookies['oni_auth'] || cookies['oni_auth'].length < 10) {
    return Response.json({ error: 'Unauthorized' }, { status: 401, headers: CORS });
  }

  const SUPABASE_URL = env.SUPABASE_URL;
  const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return Response.json({ error: 'Supabase nincs konfigurálva' }, { status: 500, headers: CORS });
  }

  const [episodesRes, usersRes] = await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/watched_episodes?select=watched_count`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` },
    }),
    fetch(`${SUPABASE_URL}/rest/v1/users?select=id`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` },
    }),
  ]);

  let episodes = [];
  let users = [];
  try { episodes = await episodesRes.json(); } catch {}
  try { users = await usersRes.json(); } catch {}

  const totalEpisodes = Array.isArray(episodes) ? episodes.length : 0;
  const totalUsers = Array.isArray(users) ? users.length : 0;
  const totalWatched = Array.isArray(episodes)
    ? episodes.reduce((sum, row) => sum + (row.watched_count || 0), 0)
    : 0;

  return Response.json({
    totalEpisodes,
    totalUsers,
    totalWatched,
    lastUpdated: new Date().toISOString(),
  }, { headers: CORS });
}
