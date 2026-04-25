// POST /api/sync - Extension által hívott endpoint
// Az extension elküldi az epizód adatait, a weboldal menti Supabase-be.
// Így az extension nem függ a Supabase-től közvetlenul.
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// CORS headers - extension bármely origin-ről hívhatja
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Oni-Token',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: NextRequest) {
  // 1. Token ellenőrzés
  const token = request.headers.get('X-Oni-Token');
  const validToken = process.env.EXTENSION_API_TOKEN;

  if (!validToken) {
    return NextResponse.json(
      { error: 'Server not configured: EXTENSION_API_TOKEN missing' },
      { status: 500, headers: CORS_HEADERS }
    );
  }

  if (!token || token !== validToken) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers: CORS_HEADERS }
    );
  }

  // 2. Payload validáció
  const body = await request.json().catch(() => null);
  if (!body || typeof body.show_id !== 'number' || typeof body.episode !== 'number') {
    return NextResponse.json(
      { error: 'Invalid payload: show_id and episode must be numbers' },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const { show_id, episode, anime_title } = body;

  // 3. Supabase kapcsolat
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.json(
      { error: 'Supabase not configured' },
      { status: 500, headers: CORS_HEADERS }
    );
  }

  const supabase = createClient(url, key);

  // 4. RPC hívás - ez kezeli az INSERT/UPDATE-et és a számlálást egyszerre
  // Nincs duplikálás - csak az RPC fut, nem az upsert + rpc
  const { data, error } = await supabase.rpc('increment_watched_count', {
    p_show_id: show_id,
    p_episode: episode,
    p_anime_title: anime_title || null,
  });

  if (error) {
    console.error('[sync] RPC error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: CORS_HEADERS }
    );
  }

  return NextResponse.json(
    { success: true, show_id, episode, data },
    { headers: CORS_HEADERS }
  );
}
