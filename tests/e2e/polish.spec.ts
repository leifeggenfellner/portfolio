import { expect, test } from "@playwright/test";
import { openApp, openDesktop } from "./helpers";
import type { Page } from "@playwright/test";

async function toggleThemeFromDesktop(page: Page) {
  await page.locator("main").click({ button: "right", position: { x: 900, y: 450 } });
  await page.getByRole("menuitem", { name: /Dark Theme/ }).click();
}

test.describe("degauss", () => {
  test.skip(({ isMobile }) => isMobile, "uses the desktop context menu");

  test("is skipped under reduced motion", { tag: ["@motion"] }, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openDesktop(page);
    await toggleThemeFromDesktop(page);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    expect(await page.locator("html").getAttribute("data-degaussing")).toBeNull();
  });
});

test.describe("screensaver", () => {
  test.beforeEach(async ({ page, isMobile }) => {
    test.skip(isMobile, "phones have no screensaver; they stay lightweight");
    await page.clock.install();
  });

  test("starts after the idle delay and wakes on a key without passing it on", async ({ page }) => {
    await openDesktop(page, { settings: { screensaver: "1" } });
    const win = await openApp(page, "minigame");
    await page.clock.fastForward("00:59");
    await expect(page.locator("[data-screensaver]")).toHaveCount(0);
    await page.clock.fastForward("00:02");
    await expect(page.locator("[data-screensaver]")).toBeVisible();

    // Escape would close the focused window; the wake key must be swallowed.
    await page.keyboard.press("Escape");
    await expect(page.locator("[data-screensaver]")).toHaveCount(0);
    await expect(win).toBeVisible();
  });

  test("waits while a field holds a draft, and can be turned off", async ({ page }) => {
    await openDesktop(page, { settings: { screensaver: "1" } });
    const terminal = await openApp(page, "terminal");
    await terminal.getByRole("textbox").fill("ls -la");
    await page.clock.fastForward("02:00");
    await expect(page.locator("[data-screensaver]")).toHaveCount(0);

    await terminal.getByRole("textbox").fill("");
    await page.clock.fastForward("01:01");
    await expect(page.locator("[data-screensaver]")).toBeVisible();
  });

  test("never starts when set to Never", async ({ page }) => {
    await openDesktop(page, { settings: { screensaver: "never" } });
    await page.clock.fastForward("15:00");
    await expect(page.locator("[data-screensaver]")).toHaveCount(0);
  });
});
