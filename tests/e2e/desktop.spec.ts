import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "@playwright/test";
import { skipBoot } from "./helpers";

test("desktop boots and opens an app", async ({ page }) => {
  await page.goto("/");
  await skipBoot(page);
  // Desktop icon for About should be visible and openable
  const aboutIcon = page.getByRole("link", { name: /me\.txt|about/i }).first();
  await aboutIcon.dblclick();
  await expect(page.getByRole("dialog", { name: /me\.txt|About/i })).toBeVisible();
});

test("desktop icons open with the keyboard", async ({ page }) => {
  await page.goto("/");
  await skipBoot(page);
  const aboutIcon = page.getByRole("link", { name: /me\.txt/i }).first();
  await aboutIcon.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: /me\.txt/i })).toBeVisible();
});

test("has no critical a11y violations on first paint", async ({ page }) => {
  await page.goto("/");
  await skipBoot(page);
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  expect(results.violations).toEqual([]);
});
