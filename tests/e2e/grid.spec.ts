import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const STORAGE_KEY = "retro-os:settings";
const NO_BOOT = { bootAnimation: false };

async function seedSettings(page: Page, settings: object) {
  await page.addInitScript(
    ({ key, value }) => {
      localStorage.setItem(key, JSON.stringify(value));
    },
    { key: STORAGE_KEY, value: settings },
  );
}

async function openDesktop(page: Page, settings: object = NO_BOOT) {
  await seedSettings(page, settings);
  await page.goto("/");
  await expect(page.locator("main ul").getByRole("link", { name: "Settings" })).toBeVisible();
}

test.describe("synthwave grid", () => {
  const canvas = (page: Page) => page.locator("main [data-horizon]");

  test("draws a scrolling canvas floor", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "reduced-motion", "reduced motion draws a still frame");
    await openDesktop(page);
    await expect(canvas(page)).toHaveAttribute("data-running", "true");
    await expect(canvas(page)).toHaveAttribute("data-duration-ms", "8000");

    const first = await canvas(page).getAttribute("data-phase");
    // A busy machine can starve animation frames for a while; allow for it.
    await expect.poll(() => canvas(page).getAttribute("data-phase"), { timeout: 15_000 }).not.toBe(first);
  });

  test("fills the floor from the horizon to the bottom edge without horizontal overflow", async ({ page }) => {
    await openDesktop(page);

    for (const viewport of [
      { width: 1280, height: 720 },
      { width: 390, height: 844 },
      { width: 844, height: 390 },
    ]) {
      await page.setViewportSize(viewport);
      const bounds = await page.evaluate(() => {
        const floor = document.querySelector("main [data-horizon]")!.getBoundingClientRect();
        const horizon = document.querySelector("main .outrun-horizon")!.getBoundingClientRect();
        return {
          floor: floor.toJSON(),
          horizonY: horizon.y,
          scrollWidth: document.documentElement.scrollWidth,
          viewportWidth: window.innerWidth,
        };
      });

      expect(Math.abs(bounds.floor.top - bounds.horizonY)).toBeLessThanOrEqual(2);
      expect(bounds.floor.bottom).toBeGreaterThanOrEqual(viewport.height - 1);
      expect(bounds.floor.width).toBeGreaterThanOrEqual(viewport.width - 1);
      expect(bounds.scrollWidth).toBeLessThanOrEqual(bounds.viewportWidth);
    }
  });

  test("follows the speed, paused and reduced-motion settings", async ({ page }, testInfo) => {
    await openDesktop(page, { ...NO_BOOT, gridSpeed: "fast" });
    await expect(canvas(page)).toHaveAttribute("data-duration-ms", "4000");

    if (testInfo.project.name === "reduced-motion") {
      await expect(canvas(page)).toHaveAttribute("data-running", "false");
      return;
    }

    await expect(canvas(page)).toHaveAttribute("data-running", "true");
    await page.locator("main ul").getByRole("link", { name: "Settings" }).dblclick({ force: true });
    await page.getByRole("radio", { name: "Paused" }).check();
    await expect(canvas(page)).toHaveAttribute("data-running", "false");
  });

  test("stops while a window covers the wallpaper, and resumes when it doesn't", async ({
    page,
    isMobile,
  }, testInfo) => {
    test.skip(testInfo.project.name === "reduced-motion", "reduced motion never runs the floor");
    await openDesktop(page);
    await expect(canvas(page)).toHaveAttribute("data-running", "true");

    await page.locator('[data-app-id="about"]').focus();
    await page.keyboard.press("Enter");
    const win = page.locator('[data-window-id="about"]');
    await expect(win).toBeVisible();
    // On mobile every window is full screen; on desktop it takes a maximise.
    if (!isMobile) {
      await expect(canvas(page)).toHaveAttribute("data-running", "true");
      await win.getByRole("button", { name: "Maximize" }).click();
    }
    await expect(canvas(page)).toHaveAttribute("data-running", "false");

    await win.getByRole("button", { name: "Minimize" }).click();
    await expect(canvas(page)).toHaveAttribute("data-running", "true");
  });
});
