import { test } from "node:test";
import assert from "node:assert/strict";
import { rankBridges, diversify } from "../lib/agent";
import { parseEntities, qloo, remember, isVerified } from "../lib/qloo";
import { limit } from "../lib/http";
import { Entity, Profile } from "../lib/types";
import { planConnection } from "../lib/planner";
const e = (id: string, category: Entity["category"] = "movie"): Entity => ({
  id,
  name: id,
  category,
});
const p: [Profile, Profile] = [
  { name: "A", interests: [e("a"), e("b"), e("c")] },
  { name: "B", interests: [e("d"), e("e"), e("f")] },
];
test("only independent overlaps survive; source favorites and rejected items are excluded", () => {
  assert.deepEqual(
    rankBridges([e("a"), e("x"), e("y"), e("z")], [e("a"), e("x"), e("z")], p, [
      "z",
    ]).map((b) => b.entity.id),
    ["x"],
  );
});
test("different profiles with no common research produce no invented bridge", () =>
  assert.equal(rankBridges([e("x")], [e("y")], p, []).length, 0));
test("surprise changes ranking using lower result positions", () => {
  const list = [e("x"), e("y"), e("z")];
  assert.equal(rankBridges(list, list, p, [], true)[0].entity.id, "z");
});
test("diversity brings another category into selected results", () => {
  const list = [e("x"), e("y"), e("z", "artist")];
  const ranked = rankBridges(list, list, p, []);
  assert.equal(diversify(ranked, 2)[1].entity.category, "artist");
});
test("parses search and insights shapes and validates IDs", () => {
  const row = {
    entity_id: "12345678-1234-1234-1234-123456789abc",
    name: "Example",
    types: ["urn:entity:movie"],
  };
  assert.equal(parseEntities({ results: [row] }, "movie").length, 1);
  assert.equal(
    parseEntities({ results: { entities: [row] } }, "movie").length,
    1,
  );
  assert.equal(
    parseEntities({ results: [{ ...row, entity_id: "unsafe" }] }).length,
    0,
  );
  assert.throws(() => parseEntities({ unrecognized: [] }));
});
test("live Insights subtype is parsed instead of discarded as a generic entity", () => {
  const rows = [
    {
      entity_id: "4344F84A-69CE-46D1-B09C-02F31EC13117",
      name: "Mad Max: Fury Road",
      type: "urn:entity",
      subtype: "urn:entity:movie",
    },
  ];
  const a = parseEntities(
    { success: true, results: { entities: rows } },
    "movie",
  );
  const b = parseEntities(
    { success: true, results: { entities: rows } },
    "movie",
  );
  assert.equal(a.length, 1);
  assert.equal(rankBridges(a, b, p, []).length, 1);
  assert.equal(
    parseEntities({ results: { entities: rows } }, "artist").length,
    0,
  );
});
test("explanations use only per-result contributions from the correct profile", () => {
  const a = {
    ...e("new"),
    genres: ["Sci-Fi"],
    contributions: [
      { id: "unknown", score: 0.9 },
      { id: "a", score: 0.7 },
      { id: "d", score: 0.6 },
      { id: "b", score: 0.2 },
    ],
  };
  const b = { ...e("new"), contributions: [{ id: "d", score: 0.8 }] };
  const bridge = rankBridges([a], [b], p, [])[0];
  assert.deepEqual(
    bridge.influences?.a.map((e) => e.id),
    ["a", "b"],
  );
  assert.deepEqual(
    bridge.influences?.b.map((e) => e.id),
    ["d"],
  );
  assert.ok(bridge.reason.includes("a on one side and d on the other"));
  assert.ok(bridge.reason.includes("Sci-Fi"));
  assert.ok(!bridge.reason.includes("unknown"));
});
test("missing explanations retain overlap evidence without assigning favorites", () => {
  const bridge = rankBridges([e("new")], [e("new")], p, [])[0];
  assert.deepEqual(bridge.influences, { a: [], b: [] });
  assert.ok(!bridge.reason.includes("contributing favorites"));
  const plan = planConnection([bridge]);
  assert.equal(plan.questions.length, 3);
  assert.equal(new Set(plan.questions).size, 3);
  assert.ok(plan.challenge.includes("15 min"));
  assert.deepEqual(planConnection([]).questions, []);
});
test("metadata parser uses result-level explanation, not aggregate influence", () => {
  const row = {
    entity_id: "12345678-1234-1234-1234-123456789abc",
    name: "A real result",
    subtype: "urn:entity:movie",
    properties: { genres: ["Drama", null, 99] },
    query: {
      explainability: {
        "signal.interests.entities": [
          { entity_id: "a", score: 0.2 },
          { entity_id: "b", score: 0.8 },
          { entity_id: "c", score: -1 },
          { entity_id: "d", score: 2 },
        ],
      },
    },
  };
  const parsed = parseEntities(
    {
      results: { entities: [row] },
      query: {
        explainability: {
          "signal.interests.entities": [{ entity_id: "fake", score: 1 }],
        },
      },
    },
    "movie",
  )[0];
  assert.deepEqual(parsed.genres, ["Drama"]);
  assert.deepEqual(parsed.contributions, [
    { id: "b", score: 0.8 },
    { id: "a", score: 0.2 },
  ]);
});
test("planning makes category-specific invitations using verified names and genres", () => {
  const music = rankBridges(
    [{ ...e("Artist", "artist"), contributions: [{ id: "a", score: 1 }] }],
    [{ ...e("Artist", "artist"), contributions: [{ id: "d", score: 1 }] }],
    p,
    [],
  )[0];
  const book = rankBridges(
    [{ ...e("Book", "book"), genres: ["Fantasy"] }],
    [e("Book", "book")],
    p,
    [],
  )[0];
  const plan = planConnection([music, book]);
  assert.ok(plan.questions[0].includes("road-trip playlist"));
  assert.ok(plan.questions[0].includes("a and d"));
  assert.ok(plan.questions[1].includes("Fantasy"));
  assert.ok(plan.questions[1].includes("Read the blurb"));
  assert.ok(!plan.questions.join(" ").includes("compatibility"));
});
test("signed selections survive server instances and reject tampering", () => {
  const signed = remember(e("valid"));
  assert.ok(isVerified(signed));
  assert.ok(!isVerified({ ...signed, name: "Tampered" }));
  assert.ok(!isVerified({ ...signed, verification: "1.expired" }));
});
test("per-process rate limiter rejects request over budget", () => {
  const req = new Request("http://localhost", {
    headers: { "x-forwarded-for": "test-client" },
  });
  limit(req, 1);
  assert.throws(() => limit(req, 1), /Too many/);
});
test("Qloo missing key, rejected keys, serialization, rate limits and timeout retry", async () => {
  const old = process.env.QLOO_API_KEY;
  try {
    delete process.env.QLOO_API_KEY;
    await assert.rejects(
      qloo("/search", { query: "missing" }),
      /not configured/,
    );
    process.env.QLOO_API_KEY = "test-only";
    for (const code of [401, 403])
      await assert.rejects(
        qloo(
          "/search",
          { query: `invalid-${code}` },
          async () => new Response("", { status: code }),
        ),
        /rejected/,
      );
    let calls = 0;
    const data = await qloo(
      "/search",
      { query: "A & B", types: "urn:entity:movie" },
      async (url, init) => {
        calls++;
        assert.equal(new URL(String(url)).searchParams.get("query"), "A & B");
        assert.equal(
          (init?.headers as Record<string, string>)["X-Api-Key"],
          "test-only",
        );
        return calls === 1
          ? new Response("", { status: 429 })
          : Response.json({ results: [] });
      },
    );
    assert.deepEqual(data, { results: [] });
    assert.equal(calls, 2);
    await assert.rejects(
      qloo("/search", { query: "timeout" }, async () => {
        throw new Error("timeout");
      }),
      /could not be reached/,
    );
    await assert.rejects(
      qloo(
        "/search",
        { query: "rate-limit" },
        async () => new Response("", { status: 429 }),
      ),
      /busy/,
    );
  } finally {
    if (old === undefined) delete process.env.QLOO_API_KEY;
    else process.env.QLOO_API_KEY = old;
  }
});
