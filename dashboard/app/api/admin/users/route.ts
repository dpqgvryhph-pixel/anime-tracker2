export const runtime = 'edge';
// Admin API: Felhasználók kezelése - jogkörökkel hangsúlyozva
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { ROLE_PERMISSIONS, UserRole } from '@/lib/users.config';

function getServiceClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error('Supabase service role nincs konfigurálva');
  return createClient(url, key);
}

async function getAuthInfo(): Promise<{ isAuth: boolean; role: UserRole | null; username: string | null }> {
  const cookieStore = await cookies();
  const session = cookieStore.get('oni_session');
  const auth = cookieStore.get('oni_auth');
  const roleCookie = cookieStore.get('oni_role');
  const userCookie = cookieStore.get('oni_user');

  const isAuth = session?.value === 'valid' && !!auth?.value && auth.value.length > 10;
  const role = (roleCookie?.value as UserRole) || null;
  const username = userCookie?.value || null;

  return { isAuth, role, username };
}

export async function GET(request: NextRequest) {
  const { isAuth, role } = await getAuthInfo();

  if (!isAuth || !role) {
    return NextResponse.json({ error: 'Nincs bejelentkezve' }, { status: 401 });
  }

  // Jogkör ellenőrzés: csak aki láthatja az admin panelt
  if (!ROLE_PERMISSIONS[role]?.canViewAdmin) {
    return NextResponse.json({ error: 'Nincs jogosultságad' }, { status: 403 });
  }

  try {
    const supabase = getServiceClient();
    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, display_name, role, created_at, last_login')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ users: users || [] });
  } catch (e) {
    return NextResponse.json({ error: 'Adatbázis hiba', users: [] }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { isAuth, role } = await getAuthInfo();

  if (!isAuth || !role) {
    return NextResponse.json({ error: 'Nincs bejelentkezve' }, { status: 401 });
  }

  // Csak aki kezelhet felhasználókat (superadmin)
  if (!ROLE_PERMISSIONS[role]?.canManageUsers) {
    return NextResponse.json({ error: 'Nincs jogosultságod felhasználók hozzáadásához' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.username) {
    return NextResponse.json({ error: 'Hiányzó adatok' }, { status: 400 });
  }

  const { username, display_name, role: newRole = 'viewer' } = body;

  // Biztonság: ne lehessen superadmin-t létrehozni API-n keresztül
  const safeRole = newRole === 'superadmin' ? 'admin' : newRole;

  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from('users')
      .insert({
        username,
        display_name: display_name || username,
        role: safeRole,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ user: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Hiba történt' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { isAuth, role } = await getAuthInfo();

  if (!isAuth || !role) {
    return NextResponse.json({ error: 'Nincs bejelentkezve' }, { status: 401 });
  }

  // Csak aki törölhet (superadmin)
  if (!ROLE_PERMISSIONS[role]?.canDelete) {
    return NextResponse.json({ error: 'Nincs törlési jogosultságod' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Hiányzó ID' }, { status: 400 });

  try {
    const supabase = getServiceClient();
    // Superadmin felhasználók nem törölhetők
    const { data: targetUser } = await supabase
      .from('users').select('role').eq('id', id).single();

    if (targetUser?.role === 'superadmin') {
      return NextResponse.json({ error: 'Superadmin nem törölhető' }, { status: 403 });
    }

    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Hiba történt' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const { isAuth, role } = await getAuthInfo();

  if (!isAuth || !role) {
    return NextResponse.json({ error: 'Nincs bejelentkezve' }, { status: 401 });
  }

  if (!ROLE_PERMISSIONS[role]?.canManageUsers) {
    return NextResponse.json({ error: 'Nincs jogosultságod role módosításához' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.id || !body?.role) {
    return NextResponse.json({ error: 'Hiányzó adatok' }, { status: 400 });
  }

  // Superadmin role nem adható API-n keresztül
  const safeRole = body.role === 'superadmin' ? 'admin' : body.role;

  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from('users')
      .update({ role: safeRole })
      .eq('id', body.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ user: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Hiba történt' }, { status: 500 });
  }
}
