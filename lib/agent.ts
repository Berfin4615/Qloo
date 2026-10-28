import { Bridge, Category, Entity, Profile } from "./types";
export function rankBridges(
  a: Entity[],
  b: Entity[],
  profiles: [Profile, Profile],
  excluded: string[],
  surprise = false,
): Bridge[] {
  const favorites = new Set(
    profiles.flatMap((p) => p.interests.map((e) => e.id)),
  );
  const bm = new Map(b.map((e, i) => [e.id, i]));
  return a
    .flatMap((entity, i) => {
      const j = bm.get(entity.id);
      if (
        j === undefined ||
        excluded.includes(entity.id) ||
        favorites.has(entity.id)
      )
        return [];
      const rank = Math.round(100 * (1 / (i + 2) + 1 / (j + 2)));
      return [
        {
          entity,
          rank: surprise ? 100 - rank : rank,
          aRank: i + 1,
          bRank: j + 1,
          shared: false,
          reason: `Independently returned for both profiles in ${entity.category.replace("_", " ")} research. This supports a shared recommendation, not a claim about a specific favorite.`,
          sources: { a: profiles[0].interests, b: profiles[1].interests },
        },
      ];
    })
    .sort(
      (x, y) => y.rank - x.rank || x.entity.name.localeCompare(y.entity.name),
    );
}
export function diversify(bridges: Bridge[], limit = 5) {
  const result: Bridge[] = [];
  const seen = new Set<Category>();
  for (const b of bridges) {
    if (!seen.has(b.entity.category)) {
      result.push(b);
      seen.add(b.entity.category);
      if (result.length === limit) return result;
    }
  }
  for (const b of bridges) {
    if (!result.includes(b)) result.push(b);
    if (result.length === limit) break;
  }
  return result;
}
