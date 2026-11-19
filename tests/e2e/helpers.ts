import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

/**
 * Skip the boot sequence. Waits for the Desktop island to hydrate first
 * (Astro drops the `ssr` attribute once it has): a key pressed before then
 * has no listener and the full boot would play.
 */
export async function skipBoot(page: Page) {
  await expect(page.locator("astro-island[ssr]")).toHaveCount(0);
  await page.keyboard.press("Escape");
}
