import { expect, test } from "@playwright/test";
import { openApp, openDesktop } from "./helpers";

test("reopens the last visit's windows, arranged, only when asked to", async ({ page }) => {
  await openDesktop(page, { settings: { restoreSession: true } });
  const terminal = await openApp(page, "terminal");
  await openApp(page, "about");
  // Raise the Terminal from the taskbar, then snap it from its title bar.
  await page.locator('[data-taskbar-window="terminal"]').click();
  await terminal.getByRole("toolbar", { name: "Window header" }).focus();
  await page.keyboard.press("ArrowLeft");
  await expect(terminal).toHaveCSS("left", "0px");

  await page.reload();
  await expect(page.getByRole("dialog", { name: "Me.txt — Notepad" })).toBeVisible();
  const restored = page.getByRole("dialog", { name: "Terminal" });
  await expect(restored).toHaveCSS("left", "0px");
  // The Terminal was on top when the page was left, and is again.
  await expect.poll(() => restored.evaluate((el) => el.contains(document.activeElement))).toBe(true);

  // Turned off, the next visit starts clean.
  await page.evaluate(() => {
    const key = "retro-os:settings";
    localStorage.setItem(
      key,
      JSON.stringify({ ...JSON.parse(localStorage.getItem(key) ?? "{}"), restoreSession: false }),
    );
  });
  // (On "/": an app's own page always opens with its window.)
  await page.goto("/");
  await expect(page.getByRole("navigation", { name: "Taskbar" })).toBeVisible();
  await expect(page.locator("[data-window-id]")).toHaveCount(0);
});
