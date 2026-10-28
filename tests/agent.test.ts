import { test } from "node:test";
import assert from "node:assert/strict";
import { rankBridges, diversify } from "../lib/agent";
import { parseEntities, qloo, remember, isVerified } from "../lib/qloo";
import { limit } from "../lib/http";
import { Entity, Profile } from "../lib/types";
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
