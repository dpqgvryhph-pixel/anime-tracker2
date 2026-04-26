// Cloudflare Pages Function: POST /api/auth/logout

export async function onRequestPost() {
  const headers = new Headers();
  headers.append('Set-Cookie', 'oni_auth=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/');
  headers.append('Set-Cookie', 'oni_role=; Secure; SameSite=Lax; Max-Age=0; Path=/');
  headers.append('Set-Cookie', 'oni_user=; Secure; SameSite=Lax; Max-Age=0; Path=/');
  headers.set('Content-Type', 'application/json');
  return new Response(JSON.stringify({ success: true }), { status: 200, headers });
}
