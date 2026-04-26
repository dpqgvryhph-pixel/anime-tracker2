export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { findUser } from '@/lib/users.config';

function getServiceClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error('Supabase service role nincs konfigurálva');
  return createClient(url, key);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const { username, password } = body;

  // A users.config.ts-ből ellenőrzünk - nem környezeti változók!
  const user = findUser(username, password);

  if (!user) {
    return NextResponse.json({ error: 'Hibás felhasználónév vagy jelszó' }, { status: 401 });
  }

  // Session token generálás
  const sessionToken = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0')).join('');

  const cookieStore = await cookies();
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7, // 7 nap
    path: '/',
  };

  cookieStore.set('oni_auth', sessionToken, cookieOptions);
  cookieStore.set('oni_session', 'valid', cookieOptions);
  cookieStore.set('oni_role', user.role, { ...cookieOptions, httpOnly: false }); // frontend olvashatja
  cookieStore.set('oni_user', user.username, { ...cookieOptions, httpOnly: false });

  // Supabase upsert (opcionális - ha nincs Supabase, ez csak logol)
  try {
    const supabase = getServiceClient();
    await supabase.from('users').upsert({
      username: user.username,
      display_name: user.displayName || user.username,
      role: user.role,
      last_login: new Date().toISOString(),
    }, { onConflict: 'username' });
  } catch (_e) {
    // Supabase hiba nem akadályozza a bejelentkezést
    console.warn('Supabase upsert hiba:', _e);
  }

  return NextResponse.json({
    success: true,
    role: user.role,
    username: user.username,
    displayName: user.displayName || user.username,
  });
}
