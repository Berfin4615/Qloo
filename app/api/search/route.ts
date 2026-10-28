import { z } from "zod";
import { categories } from "@/lib/types";
import { fixtures } from "@/lib/fixtures";
import { search, ServiceError } from "@/lib/qloo";
import { limit, errorResponse } from "@/lib/http";
export async function GET(request: Request) {
  try {
    limit(request, 45);
    const u = new URL(request.url);
    const v = z
      .object({
        q: z.string().trim().min(2).max(100),
        category: z.enum(categories),
      })
      .safeParse({
        q: u.searchParams.get("q"),
        category: u.searchParams.get("category"),
      });
    if (!v.success)
      throw new ServiceError(
        "Enter 2–100 characters and choose a category.",
        400,
      );
    const mode = process.env.QLOO_API_KEY ? "live" : "fixture";
    const results =
      mode === "live"
        ? await search(v.data.q, v.data.category)
        : fixtures.filter(
            (e) =>
              e.category === v.data.category &&
              e.name.toLowerCase().includes(v.data.q.toLowerCase()),
          );
    return Response.json(
      { mode, results },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return errorResponse(e);
  }
}
