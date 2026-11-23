import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { openApp, openDesktop } from "./helpers";
import type { Page } from "@playwright/test";

// Guards the shared chrome (title bars, bevels, taskbar, menus) through the
// style refactors, in both themes. CRT off and the grid paused for stable
// pixels; the clock and the build badge, which change by themselves, are
// masked, and the wallpaper canvas (an effect, not chrome) is hidden.
const masks = (page: Page) => [page.locator("time"), page.getByRole("complementary", { name: "System information" })];
const stylePath = fileURLToPath(new URL("visual.css", import.meta.url));

for (const theme of ["light", "dark"] as const) {
  test(`window chrome, Start menu and palette in ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await openDesktop(page, { settings: { theme, crt: "off", gridSpeed: "paused" } });
    await openApp(page, "about");
    await openApp(page, "skills");
    await expect(page).toHaveScreenshot(`desktop-${theme}.png`, { mask: masks(page), stylePath });

    await page.getByRole("button", { name: "Start" }).click();
    await expect(page.getByRole("menu")).toBeVisible();
    await expect(page).toHaveScreenshot(`start-menu-${theme}.png`, { mask: masks(page), stylePath });
    await page.keyboard.press("Escape");

    await page.keyboard.press("Control+k");
    await expect(page.getByRole("combobox")).toBeFocused();
    await expect(page).toHaveScreenshot(`palette-${theme}.png`, { mask: masks(page), stylePath });
  });
}
