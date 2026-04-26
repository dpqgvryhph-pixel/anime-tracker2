export const runtime = 'edge';
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
  const cookieStore = await cookies();
  const session = cookieStore.get('oni_session');
  const auth = cookieStore.get('oni_auth');
  return session?.value === 'valid' && !!auth?.value && auth.value.length > 10;
}

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
    return NextResponse.json({ users: data || [] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const isAdmin = await checkAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.username) {
    return NextResponse.json({ error: 'username kötelező' }, { status: 400 });
  }

  const { username, display_name } = body;

  if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
    return NextResponse.json(
      { error: 'A felhasználónév 3-30 karakter, csak betű, szám, alulátáshúzójel lehet' },
      { status: 400 }
    );
  }

  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from('users')
      .insert({
        username,
        display_name: display_name || username,
        role: 'viewer',
        created_at: new Date().toISOString(),
      })
      .select('id, username, display_name, role, created_at')
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Ez a felhasználónév már foglalt' }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ user: data }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const isAdmin = await checkAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id kötelező' }, { status: 400 });

  try {
    const supabase = getServiceClient();
    const { data: user } = await supabase.from('users').select('role').eq('id', id).single();
    if (user?.role === 'admin') {
      return NextResponse.json({ error: 'Admin felhasználó nem törölhető' }, { status: 403 });
    }
    await supabase.from('users').delete().eq('id', id);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
