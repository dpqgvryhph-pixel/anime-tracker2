// Admin API: Felhasználók kezelése (csak admin role-hoz)
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

function getServiceClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error('Supabase service role nincs konfigurálva');
  return createClient(url, key);
}

async function checkAdminAuth(): Promise<boolean> {
  const cookieStore = cookies();
  const auth = cookieStore.get('oni_auth');
  return auth?.value === 'true';
}

// GET /api/admin/users - Összes felhasználó listázása (csak olvasás)
export async function GET(request: NextRequest) {
  const isAdmin = await checkAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from('users')
      .select('id, username, display_name, role, created_at, last_login')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Ismeretlen hiba';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/admin/users - Új felhasználó létrehozása (viewer role)
export async function POST(request: NextRequest) {
  const isAdmin = await checkAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { username, display_name } = await request.json();

    if (!username || typeof username !== 'string' || username.trim().length < 2) {
      return NextResponse.json({ error: 'Érvénytelen felhasználónév (min. 2 karakter)' }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase();

    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from('users')
      .insert({
        username: cleanUsername,
        display_name: display_name?.trim() || cleanUsername,
        role: 'viewer', // Új felhasználók mindig viewer jogkörrel
      })
      .select('id, username, display_name, role, created_at')
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Ez a felhasználónév már foglalt' }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Ismeretlen hiba';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
