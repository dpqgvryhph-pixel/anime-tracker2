export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Oni-Token',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

function verifyAuth(req: NextRequest, env: any) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Basic ')) return false;

  const base64Credentials = authHeader.split(' ')[1];
  let credentials;
  try {
    credentials = atob(base64Credentials);
  } catch {
    return false;
  }

  const [username, password] = credentials.split(':');

  let users: any[] = [];
  if (env.USERS_JSON) {
    try { users = JSON.parse(env.USERS_JSON); } catch { users = []; }
  }
  const fallbackUsername = process.env.ADMIN_USERNAME || env.ADMIN_USERNAME;
  const fallbackPassword = process.env.ADMIN_PASSWORD || env.ADMIN_PASSWORD;

  if (users.length === 0 && fallbackUsername && fallbackPassword) {
    users = [{ username: fallbackUsername, password: fallbackPassword, role: 'superadmin' }];
  }
  if (users.length === 0) {
    users = [{ username: 'admin', password: 'admin', role: 'superadmin' }];
  }

  const user = users.find(u => u.username === username && u.password === password);
  return !!user;
}

export async function GET(req: NextRequest) {
  const env = getRequestContext().env as any;
  if (!verifyAuth(req, env)) {
    return NextResponse.json({ error: 'Unauthorized (Hibás jelszó vagy felhasználónév)' }, { status: 401, headers: CORS });
  }

  const url = new URL(req.url);
  const show_id = url.searchParams.get('show_id');
  const episode = url.searchParams.get('episode');

  if (!show_id || !episode) {
    return NextResponse.json({ error: 'show_id és episode kötelező a query paraméterek között' }, { status: 400, headers: CORS });
  }

  try {
    if (!env || !env.DB) {
      return NextResponse.json({ error: 'Cloudflare D1 adatbázis nincs csatolva' }, { status: 500, headers: CORS });
    }

    const { results } = await env.DB.prepare(
      'SELECT * FROM watched_episodes WHERE show_id = ? AND episode = ?'
    ).bind(Number(show_id), Number(episode)).all();

    if (results && results.length > 0) {
      return NextResponse.json({ watched: true, data: results[0] }, { headers: CORS });
    } else {
      return NextResponse.json({ watched: false }, { headers: CORS });
    }
  } catch (err: any) {
    return NextResponse.json({ error: 'D1 hiba', detail: err.message }, { status: 500, headers: CORS });
  }
}

export async function POST(req: NextRequest) {
  const env = getRequestContext().env as any;
  if (!verifyAuth(req, env)) {
    return NextResponse.json({ error: 'Unauthorized (Hibás jelszó vagy felhasználónév)' }, { status: 401, headers: CORS });
  }

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers: CORS }); }

  const { show_id, episode, anime_title, duration_minutes } = body || {};
  if (typeof show_id !== 'number' || typeof episode !== 'number') {
    return NextResponse.json({ error: 'show_id és episode kötelező (number)' }, { status: 400, headers: CORS });
  }

  const duration = duration_minutes || 24;

  try {
    if (!env || !env.DB) {
      return NextResponse.json({ error: 'Cloudflare D1 adatbázis nincs csatolva' }, { status: 500, headers: CORS });
    }

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

    return NextResponse.json({ success: true, show_id, episode, data: rpcData }, { headers: CORS });
  } catch (err: any) {
    return NextResponse.json({ error: 'D1 hiba', detail: err.message }, { status: 500, headers: CORS });
  }
}
