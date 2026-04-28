// Cloudflare Pages Function: GET /api/data
// Dashboard adatok lekérése D1-ből

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

  if (!env.DB) {
    return Response.json({ error: 'Cloudflare D1 nincs csatolva' }, { status: 500 });
  }

  try {
    const { results } = await env.DB.prepare(
      'SELECT * FROM watched_episodes ORDER BY last_watched DESC'
    ).all();

    return Response.json({ data: results || [] });
  } catch (err) {
    return Response.json({ error: 'D1 hiba', detail: err.message }, { status: 500 });
  }
}
