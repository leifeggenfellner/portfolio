import { expect, test } from "@playwright/test";

const PAGES = [
  "/",
  "/about/",
  "/projects/",
  "/projects/retro-os/",
  "/terminal/",
  "/skills/",
  "/contact/",
  "/minesweeper/",
  "/settings/",
];

// After one visit the service worker has the whole site: with the network
// gone, every page still loads and the desktop still runs.
test("works offline after one visit", async ({ page, context }) => {
  await page.goto("/");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload(); // now controlled by the worker
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);

  await context.setOffline(true);
  for (const path of PAGES) {
    await page.goto(path);
    await expect(page.getByRole("navigation", { name: "Taskbar" })).toBeVisible();
  }
  await expect(page.getByRole("dialog", { name: "Settings" })).toBeVisible();
  await expect(page.locator("astro-island[ssr]")).toHaveCount(0);
});
