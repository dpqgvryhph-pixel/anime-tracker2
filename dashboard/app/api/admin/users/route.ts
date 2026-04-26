// Ez a fájl már nem aktív - a Cloudflare Pages Function kezeli: /functions/api/admin/users.js
export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
export async function GET() {
  return NextResponse.json({ error: 'Use Cloudflare Functions endpoint' }, { status: 410 });
}
export async function POST() {
  return NextResponse.json({ error: 'Use Cloudflare Functions endpoint' }, { status: 410 });
}
export async function PUT() {
  return NextResponse.json({ error: 'Use Cloudflare Functions endpoint' }, { status: 410 });
}
export async function DELETE() {
  return NextResponse.json({ error: 'Use Cloudflare Functions endpoint' }, { status: 410 });
}
