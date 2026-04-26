// Ez a fájl már nem aktív - a Cloudflare Pages Function kezeli: /functions/api/auth.js
export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
export async function POST() {
  return NextResponse.json({ error: 'Use Cloudflare Functions endpoint' }, { status: 410 });
}
