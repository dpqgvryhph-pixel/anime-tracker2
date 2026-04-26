export const runtime = 'edge';
import { NextResponse } from 'next/server';
export async function GET() {
  return NextResponse.json({ error: 'Use Cloudflare Functions endpoint' }, { status: 410 });
}
