// Opt-in integration check: node --env-file=.env.local --import tsx tests/live-smoke.ts
// No secrets or personal inputs are printed. Only fixed public demo entities are used.
import assert from "node:assert/strict";
import { search, insights } from "../lib/qloo";
import { categories, Category, Profile } from "../lib/types";
import { rankBridges, diversify } from "../lib/agent";
import { planConnection } from "../lib/planner";
if (!process.env.QLOO_API_KEY)
  throw new Error("Set QLOO_API_KEY before running live smoke tests.");
const seeds: [string, Category][][] = [
  [
    ["Interstellar", "movie"],
    ["Radiohead", "artist"],
    ["Dune (Dune, #1)", "book"],
  ],
  [
    ["Spider-Man: Into the Spider-Verse", "movie"],
    ["Daft Punk", "artist"],
    ["The Hobbit", "book"],
  ],
];
const profiles = (await Promise.all(
  seeds.map(async (list, i) => ({
    name: `Demo ${i + 1}`,
    interests: await Promise.all(
      list.map(async ([name, category]) => {
        const found = (await search(name, category)).find(
          (e) => e.name.toLowerCase() === name.toLowerCase(),
        );
        assert.ok(found, `Exact search match required for ${name}`);
        return found;
      }),
    ),
  })),
)) as [Profile, Profile];
assert.ok(
  !profiles[0].interests.some((a) =>
    profiles[1].interests.some((b) => a.id === b.id),
  ),
  "Demo profiles must have no shared inputs",
);
const batches = [];
for (const category of categories) {
  const [a, b] = await Promise.all(
    profiles.map((p) =>
      insights(
        p.interests.map((e) => e.id),
        category,
        [],
      ),
    ),
  );
  const bridges = rankBridges(a, b, profiles, []);
  console.log(
    JSON.stringify({
      category,
      aResults: a.length,
      bResults: b.length,
      overlaps: bridges.length,
    }),
  );
  batches.push(...bridges);
}
const bridges = diversify(batches.sort((a, b) => b.rank - a.rank));
assert.ok(
  bridges.some((b) => b.influences?.a.length && b.influences.b.length),
  "Live metadata should expose contributing favorites for both profiles",
);
console.log(
  JSON.stringify({
    explanations: bridges.map((b) => ({
      name: b.entity.name,
      reason: b.reason,
      a: b.influences?.a.map((e) => e.name),
      b: b.influences?.b.map((e) => e.name),
    })),
    plan: planConnection(bridges),
  }),
);
assert.ok(
  bridges.length > 0,
  "Different profiles should produce a supported new discovery in this demo",
);
console.log(
  JSON.stringify({
    passed: true,
    identicalInputs: 0,
    bridges: bridges.map((b) => ({
      name: b.entity.name,
      category: b.entity.category,
      aRank: b.aRank,
      bRank: b.bRank,
    })),
  }),
);
const top = bridges[0];
const excluded = [top.entity.id];
const [a, b] = await Promise.all(
  profiles.map((p) =>
    insights(
      p.interests.map((e) => e.id),
      top.entity.category,
      excluded,
    ),
  ),
);
assert.ok(
  !a.some((e) => e.id === top.entity.id) &&
    !b.some((e) => e.id === top.entity.id),
  "Qloo must apply rejection exclusions",
);
console.log(
  JSON.stringify({
    rejectionVerified: true,
    remainingBridges: rankBridges(a, b, profiles, excluded).length,
  }),
);
