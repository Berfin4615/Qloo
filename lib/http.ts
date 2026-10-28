import { ServiceError } from "./qloo";
const buckets = new Map<string, { count: number; reset: number }>();
export function limit(request: Request, max = 30) {
  const key =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const now = Date.now();
  if (buckets.size > 5000)
    for (const [k, v] of buckets) if (v.reset < now) buckets.delete(k);
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { count: 1, reset: now + 60000 });
    return;
  }
  if (b.count++ >= max)
    throw new ServiceError(
      "Too many requests. Please try again in a minute.",
      429,
    );
}
export function errorResponse(e: unknown) {
  return Response.json(
    {
      error:
        e instanceof ServiceError
          ? e.message
          : "The request could not be processed. Please try again.",
    },
    {
      status: e instanceof ServiceError ? e.status : 500,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
