import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

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
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Hibás felhasználónév vagy jelszó' }, { status: 401 });
}
