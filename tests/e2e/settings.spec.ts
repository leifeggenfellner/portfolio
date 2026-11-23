import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { skipBoot } from "./helpers";
import type { Page } from "@playwright/test";

const STORAGE_KEY = "retro-os:settings";
const NO_BOOT = { bootAnimation: false };
const LARGE_DARK_SETTINGS = {
  bootAnimation: false,
  theme: "dark",
  crt: "subtle",
  gridSpeed: "fast",
  iconSize: "large",
};

async function openSettings(page: Page, mobile: boolean) {
  const icon = page.locator("main ul").getByRole("link", { name: "Settings" });
  if (mobile) {
    await icon.click({ force: true });
  } else {
    await icon.dblclick();
  }
  return page.getByRole("dialog", { name: "Settings" });
}

async function seedSettings(page: Page, value: object) {
  await page.addInitScript(
    ({ key, settings }) => {
      if (sessionStorage.getItem("settings-seeded") !== "true") {
        localStorage.setItem(key, JSON.stringify(settings));
        sessionStorage.setItem("settings-seeded", "true");
      }
    },
    {
      key: STORAGE_KEY,
      settings: value,
    },
  );
}

test("persisted appearance is applied before and after island hydration", async ({ page }) => {
  await seedSettings(page, LARGE_DARK_SETTINGS);
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const expected = {
    theme: "dark",
    crt: "subtle",
    gridSpeed: "fast",
    iconSize: "large",
  };
  await expect(page.locator("html")).toHaveAttribute("data-theme", expected.theme);
  await expect(page.locator("html")).toHaveAttribute("data-crt", expected.crt);
  await expect(page.locator("html")).toHaveAttribute("data-grid-speed", expected.gridSpeed);
  await expect(page.locator("html")).toHaveAttribute("data-icon-size", expected.iconSize);
  await expect(page.locator("main ul").getByRole("link", { name: "Settings" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-theme", expected.theme);
  await expect(page.locator("html")).toHaveAttribute("data-crt", expected.crt);
});

test("boot animation preference skips the splash and BIOS", async ({ page }) => {
  await seedSettings(page, NO_BOOT);
  await page.goto("/");

  await expect(page.locator("main ul").getByRole("link", { name: "Settings" })).toBeVisible();
  await expect(page.getByRole("status", { name: "Booting RetroOS" })).toHaveCount(0);
});

test("malformed storage falls back safely and Settings has no axe violations", async ({ page }, testInfo) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.addInitScript((key) => {
    localStorage.setItem(key, "{");
    sessionStorage.setItem("settings-seeded", "true");
  }, STORAGE_KEY);
  await page.goto("/");
  await skipBoot(page);
  await expect(page.locator("main ul").getByRole("link", { name: "Settings" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

  const dialog = await openSettings(page, testInfo.project.name === "mobile-iphone");
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(results.violations).toEqual([]);
  expect(pageErrors).toEqual([]);
  await expect(dialog).toBeVisible();
});
