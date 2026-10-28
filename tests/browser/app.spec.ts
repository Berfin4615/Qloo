import { test, expect } from "@playwright/test";
test("offline demo, evidence, refinement and mobile layout", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "You have more",
  );
  await page.getByRole("button", { name: "Fill with demo profiles" }).click();
  await expect(page.getByText("A lovely starting point.")).toHaveCount(2);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Discover our connections" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Your worlds just got a little closer.",
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Offline preview — every association below is synthetic."),
  ).toBeVisible();
  await page.getByText("How we found this connection").click();
  await expect(
    page.getByText("Profile A research inputs:", { exact: false }),
  ).toBeVisible();
  const title = await page.locator(".card-title").first().innerText();
  await page.getByRole("button", { name: "Not our vibe" }).first().click();
  await expect(page.locator(".card-title").first()).not.toHaveText(title);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "docs/mobile.png", fullPage: true });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await page.screenshot({ path: "docs/desktop.png", fullPage: true });
});
test("validation and key status", async ({ request }) => {
  expect((await request.get("/api/status")).status()).toBe(200);
  expect(
    (await request.post("/api/discover", { data: { profiles: [] } })).status(),
  ).toBe(400);
  expect((await request.get("/api/search?q=a&category=movie")).status()).toBe(
    400,
  );
  const r = await request.get("/api/search?q=Radiohead&category=artist");
  expect((await r.json()).results[0].name).toBe("Radiohead");
});
