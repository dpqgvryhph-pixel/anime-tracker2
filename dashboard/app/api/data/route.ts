export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const cookieHeader = req.headers.get('Cookie') || '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(c => c.trim().split('=').map(p => decodeURIComponent(p.trim())))
    .filter(([k]: string[]) => k)
  );
  if (!cookies['oni_auth'] || cookies['oni_auth'].length < 10) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: 'Supabase nincs konfigurálva' }, { status: 500 });
  }

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/watched_episodes?select=*&order=last_watched.desc`,
    { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
  );
  const text = await res.text();
  let data: any;
  try { data = JSON.parse(text); } catch { data = []; }
  if (!res.ok) {
    return NextResponse.json({ error: 'Supabase hiba', detail: data }, { status: 500 });
  }
  return NextResponse.json({ data });
}
