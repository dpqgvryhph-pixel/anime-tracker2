export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: { 'Access-Control-Allow-Origin': 'same-origin', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
}

export async function POST(req: NextRequest) {
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { username, password } = body || {};

  const env = process.env;
  let users: any[] = [];
  if (env.USERS_JSON) {
    try { users = JSON.parse(env.USERS_JSON); } catch { users = []; }
  }
  if (users.length === 0 && env.ADMIN_USERNAME && env.ADMIN_PASSWORD) {
    users = [{ username: env.ADMIN_USERNAME, password: env.ADMIN_PASSWORD, role: 'superadmin', displayName: 'Admin' }];
  }
  if (users.length === 0) {
    users = [{ username: 'admin', password: 'admin', role: 'superadmin', displayName: 'Adminisztrátor' }];
  }

  const user = users.find((u: any) => u.username === username && u.password === password);
  if (!user) {
    return NextResponse.json({ error: 'Hibás felhasználónév vagy jelszó' }, { status: 401 });
  }

  const sessionToken = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b: number) => b.toString(16).padStart(2, '0')).join('');

  const cookieOpts = 'HttpOnly; Secure; SameSite=Lax; Max-Age=604800; Path=/';
  const headers = new Headers();
  headers.append('Set-Cookie', `oni_auth=${sessionToken}; ${cookieOpts}`);
  headers.append('Set-Cookie', `oni_role=${user.role}; Secure; SameSite=Lax; Max-Age=604800; Path=/`);
  headers.append('Set-Cookie', `oni_user=${user.username}; Secure; SameSite=Lax; Max-Age=604800; Path=/`);
  headers.set('Content-Type', 'application/json');

  return new Response(JSON.stringify({ success: true, role: user.role, username: user.username, displayName: user.displayName || user.username }), { status: 200, headers });
}
