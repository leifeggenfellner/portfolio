import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { openApp, openDesktop } from "./helpers";
import type { Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await openDesktop(page);
});

const palette = (page: Page) => page.getByRole("dialog", { name: "Run" });
const search = (page: Page) => page.getByRole("combobox", { name: /search apps/i });

test("Ctrl+K opens the palette, fuzzy search and Enter open an app", async ({ page }) => {
  await page.keyboard.press("Control+k");
  await expect(search(page)).toBeFocused();
  await search(page).fill("mnswp");
  await expect(page.getByRole("option").first()).toHaveText(/Minesweeper/);
  await expect(search(page)).toHaveAttribute("aria-activedescendant", "palette-option-app:minigame");
  await page.keyboard.press("Enter");
  await expect(palette(page)).toHaveCount(0);
  await expect(page.locator('[data-window-id="minigame"]')).toBeVisible();
});

test("arrow keys move through the results", async ({ page }) => {
  await page.keyboard.press("Control+k");
  await search(page).fill("theme");
  const options = page.getByRole("option");
  await expect(options.nth(0)).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("ArrowDown");
  await expect(options.nth(1)).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowUp");
  await expect(options.last()).toHaveAttribute("aria-selected", "true");
});

test("settings apply and Escape returns focus to where it was", async ({ page }) => {
  const term = await openApp(page, "terminal");
  const input = term.getByRole("textbox");
  await expect(input).toBeFocused();
  await page.keyboard.press("Control+k");
  await search(page).fill("theme dark");
  await page.keyboard.press("Enter");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(input).toBeFocused();

  await page.keyboard.press("Control+k");
  await page.keyboard.press("Escape");
  await expect(palette(page)).toHaveCount(0);
  // Escape closed the palette only, not the window under it.
  await expect(term).toBeVisible();
  await expect(input).toBeFocused();
});

test("projects open in the explorer, commands run in the Terminal", async ({ page }) => {
  await page.keyboard.press("Control+k");
  await search(page).fill("retro");
  await page.getByRole("option", { name: /Retro.*Projects/ }).click();
  const explorer = page.locator('[data-window-id="projects"]');
  await expect(explorer.getByRole("heading", { name: "Retro" })).toBeVisible();

  await page.keyboard.press("Control+k");
  await search(page).fill("neofetch");
  await page.keyboard.press("Enter");
  const term = page.locator('[data-window-id="terminal"]');
  await expect(term.getByRole("log")).toContainText("Uptime:");
});

test("the Start menu opens it too, and it passes axe", async ({ page }) => {
  await page.getByRole("button", { name: "Start" }).click();
  await page.getByRole("menuitem", { name: /Command palette/ }).click();
  await expect(search(page)).toBeFocused();
  await expect(palette(page)).toBeVisible();
  await expect.poll(() => palette(page).evaluate((el) => el.getAnimations().length)).toBe(0);
  const results = await new AxeBuilder({ page }).include('[role="dialog"][aria-labelledby="palette-title"]').analyze();
  expect(results.violations).toEqual([]);
});
