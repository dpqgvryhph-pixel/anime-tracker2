// CF Pages Function kezeli: /functions/api/admin/stats.js
export const runtime = 'edge';
export async function GET() {
  return new Response(JSON.stringify({ error: 'Use /api/admin/stats CF Function' }), {
    status: 410, headers: { 'Content-Type': 'application/json' }
  });
}
