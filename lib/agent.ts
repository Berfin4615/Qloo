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
      const influences = {
        a: resolveInfluences(entity, profiles[0]),
        b: resolveInfluences(b[j], profiles[1]),
      };
      return [
        {
          entity,
          rank: surprise ? 100 - rank : rank,
          aRank: i + 1,
          bRank: j + 1,
          shared: false,
          reason: explainBridge(entity, influences),
          sources: { a: profiles[0].interests, b: profiles[1].interests },
          influences,
        },
      ];
    })
    .sort(
      (x, y) => y.rank - x.rank || x.entity.name.localeCompare(y.entity.name),
    );
}
function resolveInfluences(entity: Entity, profile: Profile): Entity[] {
  return (entity.contributions ?? [])
    .flatMap((c) => {
      const input = profile.interests.find(
        (e) => e.id.toLowerCase() === c.id.toLowerCase(),
      );
      return input ? [input] : [];
    })
    .slice(0, 2);
}
function explainBridge(
  entity: Entity,
  influences: { a: Entity[]; b: Entity[] },
) {
  const a = influences.a[0]?.name;
  const b = influences.b[0]?.name;
  let text = `${entity.name} is a new meeting point: Qloo independently recommended it for both of your worlds.`;
  if (a && b)
    text += ` Qloo identifies ${a} on one side and ${b} on the other among the strongest contributing favorites.`;
  else if (a || b)
    text += ` Qloo identifies ${a ?? b} as a contributing favorite for ${a ? "the first" : "the second"} profile; the other side is supported by its independent recommendation list.`;
  if (entity.genres?.length)
    text += ` In Qloo’s catalog: ${entity.genres.slice(0, 2).join(" / ")}.`;
  return text;
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
