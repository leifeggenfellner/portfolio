import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "@playwright/test";
import { skipBoot } from "./helpers";

test("has no critical a11y violations on first paint", { tag: ["@webkit", "@mobile"] }, async ({ page }) => {
  await page.goto("/");
  await skipBoot(page);
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  expect(results.violations).toEqual([]);
});
