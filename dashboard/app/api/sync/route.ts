// POST /api/sync - Extension által hívott endoint
// Az extension elküldi az epizód adatait, a weboldal menti Supabase-be.
// Így az extension nem függ a Supabase-től közvetlenül.
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  // Token ellenőrzés
  const token = request.headers.get('X-Oni-Token');
  const validToken = process.env.EXTENSION_API_TOKEN;

  if (!validToken) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
  }
  if (!token || token !== validToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // CORS: az extension küldi a kérést
  const body = await request.json().catch(() => null);
  if (!body || typeof body.show_id !== 'number' || typeof body.episode !== 'number') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const { show_id, episode, anime_title } = body;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const supabase = createClient(url, key);

  const { error } = await supabase
    .from('watched_episodes')
    .upsert(
      {
        show_id,
        episode,
        anime_title: anime_title || null,
        last_watched: new Date().toISOString(),
      },
      {
        onConflict: 'show_id,episode',
        ignoreDuplicates: false,
      }
    );

  // Ha upsert nem növeli a watched_count-ot, RPC-t hívunk
  if (!error) {
    await supabase.rpc('increment_watched_count', {
      p_show_id: show_id,
      p_episode: episode,
      p_anime_title: anime_title || null,
    });
  }

  if (error) {
    console.error('[sync]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, show_id, episode });
}

// CORS preflight az extension Origin-nek
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Oni-Token',
    },
  });
}
