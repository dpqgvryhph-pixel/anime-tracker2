// CF Pages Function kezeli: /functions/api/admin/token.js
export const runtime = 'edge';
export async function GET() {
  return new Response(JSON.stringify({ error: 'Use /api/admin/token CF Function' }), {
    status: 410, headers: { 'Content-Type': 'application/json' }
  });
}
