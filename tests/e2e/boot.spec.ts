import { expect, test } from "@playwright/test";
import { skipBoot } from "./helpers";
import type { Page } from "@playwright/test";

const VISITED_KEY = "retro-os:visited";

async function visit(page: Page, { returning }: { returning: boolean }) {
  await page.addInitScript(
    ({ key, returning }) => {
      if (returning) localStorage.setItem(key, "true");
    },
    { key: VISITED_KEY, returning },
  );
  await page.goto("/");
}

const bios = (page: Page) => page.locator(".boot-frame");
const splash = (page: Page) => page.locator(".outrun-splash-root");
const desktopIcon = (page: Page) => page.locator("main ul").getByRole("button", { name: "Settings" });

test("a first visit plays the BIOS, then the splash, then the desktop", async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name === "reduced-motion",
    "reduced motion holds the splash for 300ms, too briefly to inspect",
  );
  await visit(page, { returning: false });
  await expect(bios(page)).toBeVisible();
  await expect(splash(page)).toBeVisible({ timeout: 5_000 });
  await expect(splash(page)).toHaveAttribute("data-sun-rise", "");
  await expect(splash(page).locator("[data-horizon]")).toHaveAttribute("aria-hidden", "true");
  await expect(splash(page)).toHaveCount(0, { timeout: 5_000 });
  await expect(desktopIcon(page)).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), VISITED_KEY)).toBe("true");
});

test("a returning visitor skips the BIOS and reaches the desktop quickly", async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name === "reduced-motion",
    "reduced motion holds the splash for 300ms, too briefly to inspect",
  );
  await visit(page, { returning: true });
  await expect(splash(page)).toBeVisible();
  await expect(bios(page)).toHaveCount(0);
  await expect(splash(page)).not.toHaveAttribute("data-sun-rise");
  // The splash is ~1.1s; CI runners without a GPU paint the canvas in
  // software and fire timers late, so allow the same margin as a first visit.
  await expect(splash(page)).toHaveCount(0, { timeout: 5_000 });
  await expect(desktopIcon(page)).toBeVisible();
});

test("a skip key during the BIOS goes straight to the desktop", async ({ page }) => {
  await visit(page, { returning: false });
  await skipBoot(page);
  await expect(desktopIcon(page)).toBeVisible();
  await expect(splash(page)).toHaveCount(0);
  await expect(bios(page)).toHaveCount(0);
});
