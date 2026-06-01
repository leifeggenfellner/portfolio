import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "@playwright/test";

test("desktop boots and opens an app", async ({ page }) => {
  await page.goto("/");
  // Skip the boot sequence
  await page.keyboard.press("Escape");
  // Desktop icon for About should be visible and openable
  const aboutIcon = page.getByRole("button", { name: /me\.txt|about/i }).first();
  await aboutIcon.dblclick();
  await expect(page.getByRole("dialog", { name: /me\.txt|About/i })).toBeVisible();
});

test("has no critical a11y violations on first paint", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Escape");
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .disableRules(["color-contrast"]) // CRT/vaporwave triages contrast separately
    .analyze();
  expect(results.violations).toEqual([]);
});
