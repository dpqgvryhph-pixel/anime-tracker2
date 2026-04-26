export const runtime = 'edge';
// Admin API: Összegésítő statisztikák
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  // Új session-alapú cookie ellenőrzés
  const cookieStore = cookies();
  const session = cookieStore.get('oni_session');
  const auth = cookieStore.get('oni_auth');
  const isAdmin = session?.value === 'valid' && !!auth?.value && auth.value.length > 10;
  
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: 'Supabase nincs konfigurálva' }, { status: 500 });
  }

  const supabase = createClient(url, key);

  const [episodesRes, usersRes] = await Promise.all([
    supabase.from('watched_episodes').select('*', { count: 'exact', head: false }),
    supabase.from('users').select('id', { count: 'exact', head: false }),
  ]);

  const totalEpisodes = episodesRes.count ?? 0;
  const totalUsers = usersRes.count ?? 0;
  const totalWatched = (episodesRes.data || []).reduce(
    (sum: number, row: any) => sum + (row.watched_count || 0), 0
  );

  return NextResponse.json({
    totalEpisodes,
    totalUsers,
    totalWatched,
    lastUpdated: new Date().toISOString(),
  });
}
