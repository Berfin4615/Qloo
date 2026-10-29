import { z } from "zod";
import { categories, Discovery, Entity } from "@/lib/types";
import { fixtures } from "@/lib/fixtures";
import { insights, isVerified, ServiceError } from "@/lib/qloo";
import { rankBridges, diversify } from "@/lib/agent";
import { limit, errorResponse } from "@/lib/http";
import { planConnection } from "@/lib/planner";
const entity = z.object({
  id: z.string().max(80),
  name: z.string().min(1).max(200),
  category: z.enum(categories),
  verification: z.string().max(150).optional(),
});
const profile = z.object({
  name: z.string().max(40),
  interests: z.array(entity).min(3).max(12),
});
const schema = z.object({
  profiles: z.tuple([profile, profile]),
  excluded: z.array(z.string().max(80)).max(100).default([]),
  liked: z.array(entity).max(10).default([]),
  category: z.enum(categories).optional(),
  surprise: z.boolean().default(false),
});
export async function POST(request: Request) {
  try {
    limit(request, 12);
    if (Number(request.headers.get("content-length") ?? 0) > 20000)
      throw new ServiceError("Request is too large.", 413);
    const raw = await request.text();
    if (raw.length > 20000)
      throw new ServiceError("Request is too large.", 413);
    let json;
    try {
      json = JSON.parse(raw);
    } catch {
      throw new ServiceError("Invalid request.", 400);
    }
    const parsed = schema.safeParse(json);
    if (!parsed.success)
      throw new ServiceError("Select 3–12 interests for each person.", 400);
    const { profiles, excluded, liked, category, surprise } = parsed.data;
    const mode = process.env.QLOO_API_KEY ? "live" : "fixture";
    const valid = (e: Entity) =>
      mode === "live"
        ? isVerified(e)
        : fixtures.some(
            (f) =>
              f.id === e.id && f.name === e.name && f.category === e.category,
          );
    if (
      !profiles.every(
        (p) =>
          new Set(p.interests.map((e) => e.id)).size === p.interests.length,
      ) ||
      ![...profiles.flatMap((p) => p.interests), ...liked].every(valid)
    )
      throw new ServiceError(
        "Please reselect your interests using search; their verification may have expired.",
        400,
      );
    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: unknown) =>
          controller.enqueue(
            new TextEncoder().encode(JSON.stringify(event) + "\n"),
          );
        try {
          const trace: string[] = [];
          const step = (stage: number, message: string) => {
            trace.push(message);
            send({ stage, message });
          };
          step(
            0,
            "Validated two consented profiles and their selected entity IDs.",
          );
          step(
            1,
            mode === "live"
              ? "Querying Qloo independently for each profile."
              : "Reading synthetic offline fixture associations (not Qloo evidence).",
          );
          const cats = category ? [category] : [...categories];
          const warnings: string[] = [];
          const researchCounts: string[] = [];
          const batches = [];
          for (const cat of cats) {
            try {
              const results = await Promise.all(
                profiles.map((p, index) =>
                  mode === "live"
                    ? insights(
                        [
                          ...new Set(
                            [...p.interests, ...liked].map((e) => e.id),
                          ),
                        ],
                        cat,
                        excluded,
                      )
                    : Promise.resolve(
                        fixtures
                          .filter((e) => e.category === cat)
                          .slice(index === 0 ? 0 : 1),
                      ),
                ),
              );
              researchCounts.push(
                `${cat}: ${results[0].length} and ${results[1].length} recommendations`,
              );
              batches.push(
                rankBridges(
                  results[0],
                  results[1],
                  profiles.map((p) => ({
                    ...p,
                    interests: [
                      ...new Map(
                        [...p.interests, ...liked].map((e) => [e.id, e]),
                      ).values(),
                    ],
                  })) as typeof profiles,
                  excluded,
                  surprise,
                ),
              );
            } catch (e) {
              if (e instanceof ServiceError && [503, 429].includes(e.status))
                throw e;
              warnings.push(
                `${cat}: ${e instanceof Error ? e.message : "Research unavailable"}`,
              );
            }
          }
          if (!researchCounts.length && warnings.length) {
            throw new ServiceError(
              "Cultural research could not be completed. Please try again. No connection assessment was made.",
            );
          }
          step(
            2,
            `Compared independent result sets (${researchCounts.join("; ")}); retained only common entities.`,
          );
          const ranked = batches.flat().sort((a, b) => b.rank - a.rank);
          let bridges = diversify(ranked);
          if (!bridges.length) {
            const shared = profiles[0].interests.filter(
              (a) =>
                profiles[1].interests.some((b) => a.id === b.id) &&
                !excluded.includes(a.id),
            );
            bridges = shared.map((entity) => ({
              entity,
              rank: 0,
              aRank: null,
              bRank: null,
              shared: true,
              reason:
                "Both participants explicitly selected this favorite. No inferred Qloo connection is claimed.",
              sources: { a: [entity], b: [entity] },
            }));
          }
          step(
            3,
            "Ranked by reciprocal result positions, prioritized category diversity, and applied feedback. Planning uses verified names only.",
          );
          const plan = planConnection(bridges);
          const result: Discovery = {
            mode,
            bridges,
            trace,
            warnings,
            ...plan,
          };
          send({ result });
        } catch (e) {
          send({ error: e instanceof Error ? e.message : "Discovery failed." });
        } finally {
          controller.close();
        }
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-store",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
export const maxDuration = 180;
