// Run against the local live server: node --import tsx tests/live-browser.ts
import { chromium, expect } from "@playwright/test";
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  await page.goto("http://localhost:3000");
  await expect(page.locator(".mode-banner")).toContainText("Live Qloo mode");
  await page.getByRole("button", { name: "Fill with demo profiles" }).click();
  await expect(page.getByText("A lovely starting point.")).toHaveCount(2, {
    timeout: 30000,
  });
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Discover our connections" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Your worlds just got a little closer.",
    }),
  ).toBeVisible({ timeout: 120000 });
  const cards = page.locator(".card-title");
  await expect(page.locator(".influence-grid")).toContainText(
    "CONTRIBUTING FAVORITES",
  );
  await expect(page.locator(".influence-grid")).not.toContainText(
    "individual contributions unavailable",
  );
  await expect(page.locator(".questions p")).toHaveCount(3);
  const count = await cards.count();
  if (!count) throw new Error("No live bridges shown");
  console.log(
    JSON.stringify({
      liveBrowserPassed: true,
      cards: count,
      titles: await cards.allTextContents(),
    }),
  );
  await page.getByText("How we found this connection").click();
  await expect(
    page.getByText("Profile A research inputs:", { exact: false }),
  ).toBeVisible();
  await page.screenshot({ path: "docs/live-results.png", fullPage: true });
  const rejected = await cards.first().innerText();
  await page.getByRole("button", { name: "Not our vibe" }).first().click();
  await expect(
    page.getByRole("button", { name: "Discover our connections" }),
  ).toBeEnabled({ timeout: 120000 });
  await expect(cards.first()).not.toHaveText(rejected);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  console.log(
    JSON.stringify({ liveBrowserRejectionPassed: true, mobileOverflow: false }),
  );
} finally {
  await browser.close();
}
