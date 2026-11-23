import { expect, test } from "@playwright/test";
import { openDesktop } from "./helpers";

const APPS = ["Me.txt — Notepad", "Projects", "Terminal", "Skills Matrix", "Contact", "Minesweeper", "Settings"];

// From page load, with the keyboard only: reach every app's icon, open it,
// land inside its window, hear it announced, close it and come back.
test("a keyboard-only tour opens and closes every app", { tag: ["@webkit"] }, async ({ page }) => {
  await openDesktop(page);
  const announcer = page.locator("[data-announcer]");
  await page.keyboard.press("Tab");
  await expect(page.locator("[data-app-id]").first()).toBeFocused();

  for (const [i, title] of APPS.entries()) {
    await page.keyboard.press("Home");
    for (let step = 0; step < i; step++) await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");

    const win = page.getByRole("dialog", { name: title });
    await expect(win).toBeVisible();
    // Focus is in the window: on its app's first field, or on the frame itself.
    await expect.poll(() => win.evaluate((el) => el.contains(document.activeElement))).toBe(true);
    await expect(announcer).toHaveText(`${title} opened`);

    await page.keyboard.press("Escape");
    await expect(win).toHaveCount(0);
    await expect(announcer).toHaveText(`${title} closed`);
    // Focus lands on the taskbar; Shift+Tab goes back to the icons.
    await page.keyboard.press("Shift+Tab");
    await expect(page.locator("[data-app-id]:focus")).toHaveCount(1);
  }
});
