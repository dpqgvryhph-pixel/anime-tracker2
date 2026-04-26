// CF Pages Function kezeli: /functions/api/admin/users.js
export const runtime = 'edge';
export async function GET() {
  return new Response(JSON.stringify({ error: 'Use /api/admin/users CF Function' }), {
    status: 410, headers: { 'Content-Type': 'application/json' }
  });
}
export async function POST() { return GET(); }
export async function PUT() { return GET(); }
export async function DELETE() { return GET(); }
