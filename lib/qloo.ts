import { categories, Category, Entity } from "./types";
import { createHmac, timingSafeEqual } from "node:crypto";
export class ServiceError extends Error {
  constructor(
    message: string,
    public status = 502,
  ) {
    super(message);
  }
}
const cache = new Map<string, { expires: number; data: unknown }>();
function signature(e: Entity, expiry: string) {
  return createHmac("sha256", process.env.QLOO_API_KEY ?? "unconfigured")
    .update(JSON.stringify([e.id, e.name, e.category, expiry]))
    .digest("hex");
}
export function remember(e: Entity) {
  const expiry = String(Date.now() + 1800000);
  return { ...e, verification: `${expiry}.${signature(e, expiry)}` };
}
export function isVerified(e: Entity) {
  if (!e.verification) return false;
  const [expiry, sig] = e.verification.split(".");
  if (!sig || !Number.isFinite(Number(expiry)) || Number(expiry) < Date.now())
    return false;
  const expected = signature(e, expiry);
  return (
    sig.length === expected.length &&
    timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  );
}
export function parseEntities(payload: unknown, category?: Category): Entity[] {
  const p = payload as { results?: unknown };
  const results = p?.results;
  const rows = Array.isArray(results)
    ? results
    : (results as { entities?: unknown })?.entities;
  if (!Array.isArray(rows))
    throw new ServiceError(
      "Qloo returned an unexpected response format. No results were inferred.",
    );
  return rows.flatMap((r) => {
    const id = r.entity_id ?? r.id;
    const type =
      r.types?.find((t: string) => t.startsWith("urn:entity:")) ?? r.type;
    const c = type?.replace("urn:entity:", "") ?? category;
    return typeof id === "string" &&
      /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(id) &&
      typeof r.name === "string" &&
      categories.includes(c) &&
      (!category || c === category)
      ? [{ id, name: r.name.slice(0, 200), category: c as Category }]
      : [];
  });
}
export async function qloo(
  path: string,
  params: Record<string, string>,
  fetcher: typeof fetch = fetch,
): Promise<unknown> {
  const key = process.env.QLOO_API_KEY;
  if (!key) throw new ServiceError("Qloo API key is not configured.", 503);
  const url = new URL(path, "https://hackathon.api.qloo.com");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const cached = cache.get(url.href);
  if (cached && cached.expires > Date.now()) return cached.data;
  for (let attempt = 0; attempt < 3; attempt++) {
    let res: Response;
    try {
      res = await fetcher(url, {
        headers: { "X-Api-Key": key, accept: "application/json" },
        signal: AbortSignal.timeout(12000),
        cache: "no-store",
      });
    } catch {
      if (attempt === 2)
        throw new ServiceError(
          "Qloo could not be reached. Please try again.",
          504,
        );
      await new Promise((r) => setTimeout(r, 300 * 2 ** attempt));
      continue;
    }
    if (res.status === 401 || res.status === 403)
      throw new ServiceError(
        "Qloo rejected the server API key. Please check deployment configuration.",
        503,
      );
    if (path === "/search" && res.status === 404) return { results: [] };
    if ((res.status === 429 || res.status >= 500) && attempt < 2) {
      await new Promise((r) => setTimeout(r, 500 * 2 ** attempt));
      continue;
    }
    if (!res.ok)
      throw new ServiceError(
        res.status === 429
          ? "Qloo is busy. Please wait a moment before trying again."
          : res.status === 400
            ? "Qloo could not process these interests. Try selecting them again."
            : "Qloo returned an error. Please try again.",
        res.status === 429 ? 429 : 502,
      );
    let data: unknown;
    try {
      data = await res.json();
    } catch {
      throw new ServiceError("Qloo returned an unreadable response.");
    }
    if (cache.size > 300) cache.clear();
    cache.set(url.href, { expires: Date.now() + 300000, data });
    return data;
  }
  throw new ServiceError("Qloo is temporarily unavailable.");
}
export async function search(query: string, category: Category) {
  return parseEntities(
    await qloo("/search", {
      query,
      types: `urn:entity:${category}`,
      take: "8",
    }),
    category,
  ).map(remember);
}
export async function insights(
  ids: string[],
  category: Category,
  exclude: string[],
) {
  return parseEntities(
    await qloo("/v2/insights", {
      "filter.type": `urn:entity:${category}`,
      "signal.interests.entities": ids.join(","),
      "filter.exclude.entities": exclude.join(","),
      take: "30",
    }),
    category,
  ).map(remember);
}
