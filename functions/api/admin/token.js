// Cloudflare Pages Function: GET /api/admin/token
// Visszaadja az EXTENSION_API_TOKEN erteket (csak adminnak)

const CORS = {
  'Access-Control-Allow-Origin': 'same-origin',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestGet({ request, env }) {
  const cookieHeader = request.headers.get('Cookie') || '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(c => c.trim().split('=').map(p => decodeURIComponent(p.trim())))
      .filter(([k]) => k)
  );

  if (!cookies['oni_auth'] || cookies['oni_auth'].length < 10) {
    return Response.json({ error: 'Unauthorized' }, { status: 401, headers: CORS });
  }

  const token = env.EXTENSION_API_TOKEN;
  if (!token) {
    return Response.json({ token: null, error: 'EXTENSION_API_TOKEN nincs beallitva' }, { headers: CORS });
  }

  return Response.json({ token }, { headers: CORS });
}
