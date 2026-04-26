export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // Cookie auth ellenorzos
  const cookieHeader = req.headers.get('Cookie') || '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(c => c.trim().split('=').map(p => decodeURIComponent(p.trim())))
    .filter(([k]: string[]) => k)
  );
  if (!cookies['oni_auth'] || cookies['oni_auth'].length < 10) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = process.env.EXTENSION_API_TOKEN || null;
  return NextResponse.json({ token });
}
