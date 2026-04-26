// Cloudflare Pages Function: POST /api/auth
// Bejelentkezés - session cookie-t állít be

const CORS = {
  'Access-Control-Allow-Origin': 'same-origin',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { username, password } = body || {};

  // Felhasználók env-ből (USERS_JSON formátum: [{"username":"admin","password":"xxx","role":"superadmin"}])
  // Vagy fallback: ADMIN_USERNAME + ADMIN_PASSWORD env vars
  let users = [];
  if (env.USERS_JSON) {
    try { users = JSON.parse(env.USERS_JSON); } catch { users = []; }
  }
  // Fallback egyszerű admin
  if (users.length === 0 && env.ADMIN_USERNAME && env.ADMIN_PASSWORD) {
    users = [{ username: env.ADMIN_USERNAME, password: env.ADMIN_PASSWORD, role: 'superadmin', displayName: 'Admin' }];
  }
  // Hardcoded fallback ha semmi nincs beállítva (fejlesztéshez)
  if (users.length === 0) {
    users = [{ username: 'admin', password: 'admin', role: 'superadmin', displayName: 'Adminisztrátor' }];
  }

  const user = users.find(u => u.username === username && u.password === password);
  if (!user) {
    return Response.json({ error: 'Hibás felhasználónév vagy jelszó' }, { status: 401 });
  }

  // Session token
  const sessionToken = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0')).join('');

  const cookieOpts = 'HttpOnly; Secure; SameSite=Lax; Max-Age=604800; Path=/';
  const headers = new Headers();
  headers.append('Set-Cookie', `oni_auth=${sessionToken}; ${cookieOpts}`);
  headers.append('Set-Cookie', `oni_role=${user.role}; Secure; SameSite=Lax; Max-Age=604800; Path=/`);
  headers.append('Set-Cookie', `oni_user=${user.username}; Secure; SameSite=Lax; Max-Age=604800; Path=/`);
  headers.set('Content-Type', 'application/json');

  return new Response(JSON.stringify({
    success: true,
    role: user.role,
    username: user.username,
    displayName: user.displayName || user.username,
  }), { status: 200, headers });
}
