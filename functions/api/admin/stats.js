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

  if (!env.DB) {
    return Response.json({ error: 'Cloudflare D1 nincs csatolva (DB)' }, { status: 500, headers: CORS });
  }

  try {
    const episodesRes = await env.DB.prepare('SELECT watched_count FROM watched_episodes').all();
    const usersRes = await env.DB.prepare('SELECT id FROM users').all();

    const episodes = episodesRes.results || [];
    const users = usersRes.results || [];

    const totalEpisodes = episodes.length;
    const totalUsers = users.length;
    const totalWatched = episodes.reduce((sum, row) => sum + (row.watched_count || 0), 0);

    return Response.json({
      totalEpisodes,
      totalUsers,
      totalWatched,
      lastUpdated: new Date().toISOString(),
    }, { headers: CORS });
  } catch (err) {
    return Response.json({ error: 'D1 hiba', detail: err.message }, { status: 500, headers: CORS });
  }
}
