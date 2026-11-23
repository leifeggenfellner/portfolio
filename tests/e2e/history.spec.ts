import { expect, test } from "@playwright/test";
import { openApp, openDesktop } from "./helpers";

test("windows are routes: the URL follows them, Back closes, Forward and reload reopen", async ({ page }) => {
  await openDesktop(page);
  const terminal = await openApp(page, "terminal");
  await expect(page).toHaveURL(/\/terminal\/$/);
  await expect(page).toHaveTitle("Terminal · RETRO//OS");

  await page.goBack();
  await expect(terminal).toHaveCount(0);
  await expect(page).toHaveURL(/\/$/);
  await expect(page).toHaveTitle(/^Leif Eggenfellner/);

  await page.goForward();
  await expect(page.getByRole("dialog", { name: "Terminal" })).toBeVisible();

  // A project opened from the palette gets its own URL, which survives a reload.
  await page.keyboard.press("Control+k");
  await page.getByRole("combobox").fill("retro");
  await page.getByRole("option", { name: /Retro.*Projects/ }).click();
  await expect(page).toHaveURL(/\/projects\/retro-os\/$/);
  await page.reload();
  await expect(page.getByRole("dialog", { name: "Projects" }).getByRole("heading", { name: "Retro" })).toBeVisible();
});
