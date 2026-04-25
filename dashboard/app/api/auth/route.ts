import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  const { username, password } = await request.json();

  const validUser = process.env.DASHBOARD_USERNAME;
  const validPass = process.env.DASHBOARD_PASSWORD;

  if (!validUser || !validPass) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  if (username === validUser && password === validPass) {
    const cookieStore = cookies();
    cookieStore.set('oni_auth', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    // Admin felhasználó last_login frissítése Supabase-ben (service role kulccsal)
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && serviceKey) {
      const supabase = createClient(supabaseUrl, serviceKey);
      await supabase.from('users')
        .upsert({ username: validUser, display_name: validUser, role: 'admin', last_login: new Date().toISOString() }, { onConflict: 'username' });
    }

    return NextResponse.json({ success: true, role: 'admin' });
  }

  return NextResponse.json({ error: 'Hibás felhasználónév vagy jelszó' }, { status: 401 });
}
