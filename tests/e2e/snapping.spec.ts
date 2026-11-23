import { expect, test } from "@playwright/test";
import { openApp, openDesktop } from "./helpers";
import type { Locator, Page } from "@playwright/test";

test.skip(({ isMobile }) => isMobile, "Mobile windows are always full screen");

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openDesktop(page);
});

async function box(win: Locator) {
  // Measured once the window's animations have settled.
  await expect.poll(() => win.evaluate((el) => el.getAnimations().length)).toBe(0);
  return (await win.boundingBox())!;
}

async function dragTitleTo(page: Page, win: Locator, x: number, y: number) {
  // Grab the title bar where it is once the window has finished opening.
  await expect.poll(() => win.evaluate((el) => el.getAnimations().length)).toBe(0);
  const title = await win.getByRole("toolbar", { name: "Window header" }).boundingBox();
  await page.mouse.move(title!.x + 60, title!.y + title!.height / 2);
  await page.mouse.down();
  await page.mouse.move(x, y, { steps: 8 });
  return {
    preview: page.locator("[data-snap-preview]"),
    drop: () => page.mouse.up(),
  };
}

test("dragging to the left edge shows a preview and snaps to the left half", { tag: ["@webkit"] }, async ({ page }) => {
  const win = await openApp(page, "about");
  const before = await box(win);
  const { preview, drop } = await dragTitleTo(page, win, 2, 400);
  await expect(preview).toHaveAttribute("data-snap-preview", "left");
  await drop();
  await expect(preview).toHaveCount(0);
  const snapped = await box(win);
  expect(snapped.x).toBe(0);
  expect(snapped.width).toBe(640);

  // Dragging it away gives it back its old size.
  const away = await dragTitleTo(page, win, 500, 300);
  await expect(away.preview).toHaveCount(0);
  await away.drop();
  const restored = await box(win);
  expect(restored.width).toBe(before.width);
  expect(restored.height).toBe(before.height);
});

test("dragging to the top edge maximises", async ({ page }) => {
  const win = await openApp(page, "about");
  const { preview, drop } = await dragTitleTo(page, win, 640, 1);
  await expect(preview).toHaveAttribute("data-snap-preview", "max");
  await drop();
  await expect(win.getByRole("button", { name: "Restore" })).toBeVisible();
});

test("arrow keys on the title bar snap, maximise and restore", async ({ page }) => {
  const win = await openApp(page, "about");
  const before = await box(win);
  const title = win.getByRole("toolbar", { name: "Window header" });
  await title.focus();
  await page.keyboard.press("ArrowRight");
  const right = await box(win);
  expect(right.x + right.width).toBe(1280);
  await page.keyboard.press("ArrowUp");
  await expect(win.getByRole("button", { name: "Restore" })).toBeVisible();
  await page.keyboard.press("ArrowDown");
  await expect(win.getByRole("button", { name: "Maximize" })).toBeVisible();
  await page.keyboard.press("ArrowDown");
  const restored = await box(win);
  expect(restored.width).toBe(before.width);
});

test("Alt+Shift+arrow snaps the active window, but not while typing", async ({ page }) => {
  const term = await openApp(page, "terminal");
  const input = term.getByRole("textbox");
  await expect(input).toBeFocused();
  const before = await box(term);
  await page.keyboard.press("Alt+Shift+ArrowLeft");
  expect((await box(term)).x).toBe(before.x);

  await term.getByRole("toolbar", { name: "Window header" }).focus();
  await page.keyboard.press("Alt+Shift+ArrowLeft");
  const snapped = await box(term);
  expect(snapped.x).toBe(0);
  expect(snapped.width).toBe(640);
});
