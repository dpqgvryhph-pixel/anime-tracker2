// Ez a fájl már nem aktív - a Cloudflare Pages Function kezeli: /functions/api/data.js
export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
export async function GET() {
  return NextResponse.json({ error: 'Use Cloudflare Functions endpoint' }, { status: 410 });
}
