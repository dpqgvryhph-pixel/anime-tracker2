export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Oni-Token',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(req: NextRequest) {
  const token = req.headers.get('X-Oni-Token');
  const validToken = process.env.EXTENSION_API_TOKEN;
  if (!validToken) return NextResponse.json({ error: 'EXTENSION_API_TOKEN nincs beállítva' }, { status: 500, headers: CORS });
  if (!token || token !== validToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: CORS });

  const url = new URL(req.url);
  const show_id = url.searchParams.get('show_id');
  const episode = url.searchParams.get('episode');

  if (!show_id || !episode) {
    return NextResponse.json({ error: 'show_id és episode kötelező a query paraméterek között' }, { status: 400, headers: CORS });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!SUPABASE_URL || !SUPABASE_KEY) return NextResponse.json({ error: 'Supabase env vars hiányoznak' }, { status: 500, headers: CORS });

  // Query supabase
  const res = await fetch(`${SUPABASE_URL}/rest/v1/watched_episodes?show_id=eq.${show_id}&episode=eq.${episode}&select=*`, {
    method: 'GET',
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` },
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'Hiba a lekérdezés során' }, { status: 500, headers: CORS });
  }

  const data = await res.json();
  if (data && data.length > 0) {
    return NextResponse.json({ watched: true, data: data[0] }, { headers: CORS });
  } else {
    return NextResponse.json({ watched: false }, { headers: CORS });
  }
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('X-Oni-Token');
  const validToken = process.env.EXTENSION_API_TOKEN;
  if (!validToken) {
    return NextResponse.json({ error: 'EXTENSION_API_TOKEN nincs beállítva' }, { status: 500, headers: CORS });
  }
  if (!token || token !== validToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: CORS });
  }

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers: CORS }); }

  const { show_id, episode, anime_title } = body || {};
  if (typeof show_id !== 'number' || typeof episode !== 'number') {
    return NextResponse.json({ error: 'show_id és episode kötelező (number)' }, { status: 400, headers: CORS });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: 'Supabase env vars hiányoznak' }, { status: 500, headers: CORS });
  }

  const rpcRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/increment_watched_count`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` },
    body: JSON.stringify({ p_show_id: show_id, p_episode: episode, p_anime_title: anime_title || null }),
  });

  const rpcText = await rpcRes.text();
  let rpcData: any;
  try { rpcData = JSON.parse(rpcText); } catch { rpcData = rpcText; }
  if (!rpcRes.ok) {
    return NextResponse.json({ error: 'Supabase RPC hiba', detail: rpcData }, { status: 500, headers: CORS });
  }

  return NextResponse.json({ success: true, show_id, episode, data: rpcData }, { headers: CORS });
}
