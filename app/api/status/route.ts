export async function GET() {
  return Response.json(
    { mode: process.env.QLOO_API_KEY ? "live" : "fixture" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
