export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  
  const { username, password } = body;
  const validUser = process.env.DASHBOARD_USERNAME;
  const validPass = process.env.DASHBOARD_PASSWORD;

  if (!validUser || !validPass) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  if (username === validUser && password === validPass) {
    // Biztonságos véletlenszerű session token generálása
    const sessionToken = Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join('');
    
    const cookieStore = cookies();
    cookieStore.set('oni_auth', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 nap
      path: '/',
    });
    // Session token tárolása (egyszerűsített: env-ben tárolt token-nel is elfogadja)
    // A valódi ellenőrzés: ha a cookie létezik és nem üres, admin
    cookieStore.set('oni_session', 'valid', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    // Admin felhasználó last_login frissítése Supabase-ben
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && serviceKey) {
      try {
        const supabase = createClient(supabaseUrl, serviceKey);
        await supabase.from('users').upsert(
          { username: validUser, display_name: 'Admin', role: 'admin', last_login: new Date().toISOString() },
          { onConflict: 'username' }
        );
      } catch (e) {
        console.warn('[auth] Supabase users update failed (nem kritíkus):', e);
      }
    }

    return NextResponse.json({ success: true, role: 'admin' });
  }

  // Helytelen belépés - kis késleltetés brute force ellen
  await new Promise(r => setTimeout(r, 500));
  return NextResponse.json({ error: 'Hibás felhasználónév vagy jelszó' }, { status: 401 });
}

export async function DELETE() {
  const cookieStore = cookies();
  cookieStore.delete('oni_auth');
  cookieStore.delete('oni_session');
  return NextResponse.json({ success: true });
}
