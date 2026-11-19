import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const SETTINGS_KEY = "retro-os:settings";
const HELP_NOTE_KEY = "retro-os:help-note";

/**
 * Skip the boot and, unless asked, the help note, so each test starts on a
 * quiet desktop. Parallel headless WebKit starves Web Animations, which can
 * stall Svelte exit transitions for seconds, so WebKit runs without motion;
 * Chromium covers the motion path.
 */
async function openDesktop(page: Page, { withNote = false } = {}) {
  if (page.context().browser()?.browserType().name() === "webkit") {
    await page.emulateMedia({ reducedMotion: "reduce" });
  }
  await page.addInitScript(
    ({ settingsKey, noteKey, dismissNote }) => {
      if (sessionStorage.getItem("shell-seeded") === "true") return;
      sessionStorage.setItem("shell-seeded", "true");
      localStorage.setItem(settingsKey, JSON.stringify({ bootAnimation: false }));
      if (dismissNote) localStorage.setItem(noteKey, "dismissed");
    },
    { settingsKey: SETTINGS_KEY, noteKey: HELP_NOTE_KEY, dismissNote: !withNote },
  );
  await page.goto("/");
  await expect(page.getByRole("navigation", { name: "Taskbar" })).toBeVisible();
}

const icon = (page: Page, name: string) => page.locator("main ul").getByRole("button", { name });
const taskbar = (page: Page) => page.getByRole("navigation", { name: "Taskbar" });

test.describe("desktop shell", () => {
  test.skip(({ isMobile }) => isMobile, "desktop pointer and keyboard model");

  test("a minimised window stays on the taskbar and restores from it", async ({ page }) => {
    await openDesktop(page);
    await icon(page, "Projects").dblclick();
    const dialog = page.getByRole("dialog", { name: "Projects" });
    await expect(dialog).toBeVisible();

    await dialog.getByRole("button", { name: "Minimize" }).click();
    await expect(dialog).toBeHidden();

    const button = taskbar(page).getByRole("button", { name: "Projects" });
    await expect(button).toBeVisible();
    await button.click();
    await expect(dialog).toBeVisible();
    await expect(dialog).toBeFocused();
  });

  test("keyboard focus follows windows as they open and close", async ({ page }) => {
    await openDesktop(page);
    await icon(page, "Me.txt").focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", { name: /me\.txt/i });
    await expect(dialog).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(taskbar(page).getByRole("button", { name: "Start" })).toBeFocused();
  });

  test("a click selects an icon, arrows move the selection, the desktop clears it", async ({ page }) => {
    await openDesktop(page);
    await icon(page, "Projects").click();
    await expect(icon(page, "Projects")).toHaveAttribute("data-selected", "true");
    await expect(page.getByRole("dialog")).toHaveCount(0);

    await page.keyboard.press("ArrowDown");
    await expect(icon(page, "Terminal")).toBeFocused();
    await expect(icon(page, "Terminal")).toHaveAttribute("data-selected", "true");
    await expect(icon(page, "Projects")).toHaveAttribute("data-selected", "false");

    await page.locator("main").click({ position: { x: 900, y: 450 } });
    await expect(page.locator('main ul button[data-selected="true"]')).toHaveCount(0);
  });

  test("the start menu works from the keyboard", async ({ page }) => {
    await openDesktop(page);
    const start = taskbar(page).getByRole("button", { name: "Start" });
    await start.focus();
    await page.keyboard.press("Enter");
    const menu = page.getByRole("menu", { name: "Start" });
    await expect(menu).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(start).toBeFocused();

    await page.keyboard.press("Enter");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog", { name: "Projects" })).toBeFocused();
  });

  test("windows can't be dragged off screen", async ({ page }) => {
    await openDesktop(page);
    await icon(page, "Projects").dblclick();
    const header = page.getByRole("dialog", { name: "Projects" }).getByRole("toolbar", { name: "Window header" });
    const box = (await header.boundingBox())!;
    await page.mouse.move(box.x + 40, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(5000, 5000, { steps: 4 });
    await page.mouse.up();

    const after = (await header.boundingBox())!;
    const viewport = page.viewportSize()!;
    expect(after.x).toBeLessThan(viewport.width - 40);
    expect(after.y).toBeLessThan(viewport.height - 36);
  });
});

test("the help note shows once, stays dismissed and reopens from Help", async ({ page }, testInfo) => {
  await openDesktop(page, { withNote: true });
  const note = page.getByRole("complementary", { name: "read me" });
  await expect(note).toBeVisible();

  await note.getByRole("button", { name: "Dismiss note" }).click();
  await expect(note).toBeHidden();
  await page.reload();
  await expect(taskbar(page)).toBeVisible();
  await expect(note).toBeHidden();

  await taskbar(page).getByRole("button", { name: "Start" }).click();
  await page.getByRole("menuitem", { name: "Help" }).click({ force: testInfo.project.name === "mobile-iphone" });
  await expect(note).toBeVisible();
  await expect(note).toBeFocused();
});
