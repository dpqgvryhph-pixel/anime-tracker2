export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  // Auth check
  const cookieStore = cookies();
  const auth = cookieStore.get('oni_auth');
    if (!auth || auth.value.length <= 10) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.json({ error: 'Supabase nincs konfigurálva a szerveren' }, { status: 500 });
  }

  const supabase = createClient(url, key);

  const { data, error } = await supabase
    .from('watched_episodes')
    .select('*')
    .order('last_watched', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
