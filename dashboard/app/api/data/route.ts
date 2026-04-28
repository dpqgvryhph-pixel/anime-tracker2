export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function GET(req: NextRequest) {
  const cookieHeader = req.headers.get('Cookie') || '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(c => c.trim().split('=').map(p => decodeURIComponent(p.trim())))
    .filter(([k]: string[]) => k)
  );
  if (!cookies['oni_auth'] || cookies['oni_auth'].length < 10) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const env = getRequestContext().env as any;
    if (!env || !env.DB) {
      return NextResponse.json({ error: 'Cloudflare D1 adatbázis (DB) nincs csatolva' }, { status: 500 });
    }

    const { results } = await env.DB.prepare(
      'SELECT * FROM watched_episodes ORDER BY last_watched DESC'
    ).all();

    return NextResponse.json({ data: results || [] });
  } catch (err: any) {
    return NextResponse.json({ error: 'D1 hiba', detail: err.message }, { status: 500 });
  }
}
