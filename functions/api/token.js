// Cloudflare Pages Function: GET /api/token
// Extension API token lekérése (csak bejelentkezett usernek)

export async function onRequestGet({ request, env }) {
  const cookieHeader = request.headers.get('Cookie') || '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(c => c.trim().split('=').map(p => decodeURIComponent(p.trim())))
      .filter(([k]) => k)
  );

  if (!cookies['oni_auth'] || cookies['oni_auth'].length < 10) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = env.EXTENSION_API_TOKEN;
  if (!token) {
    return Response.json({ error: 'EXTENSION_API_TOKEN nincs beállítva' }, { status: 500 });
  }

  return Response.json({ token });
}
