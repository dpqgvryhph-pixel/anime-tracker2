export const runtime = 'edge';
import { NextResponse } from 'next/server';
export async function POST() {
  return NextResponse.json({ error: 'Use Cloudflare Functions endpoint' }, { status: 410 });
}
export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
