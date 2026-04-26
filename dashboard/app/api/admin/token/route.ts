export const runtime = 'edge';
// GET /api/admin/token - Visszaadja az EXTENSION_API_TOKEN értékét (csak adminnak)
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  const session = cookieStore.get('oni_session');
  const auth = cookieStore.get('oni_auth');
  
  // Az új session-alapú ellenőrzés
  const isAdmin = session?.value === 'valid' && !!auth?.value && auth.value.length > 10;
  
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = process.env.EXTENSION_API_TOKEN;
  if (!token) {
    return NextResponse.json({ token: null, error: 'EXTENSION_API_TOKEN nincs beállítva a Vercel env vars-ban' });
  }

  return NextResponse.json({ token });
}
