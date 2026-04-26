// Ez a fájl már nem aktív - a Cloudflare Pages Function kezeli: /functions/api/sync.js
// Megtartva hogy a Next.js build ne törjön
export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
export async function POST() {
  return NextResponse.json({ error: 'Use Cloudflare Functions endpoint' }, { status: 410 });
}
export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
