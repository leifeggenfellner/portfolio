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

test("Settings opens from the desktop icon and relaunch focuses one window", async ({ page }, testInfo) => {
  await seedSettings(page, NO_BOOT);
  await page.goto("/");

  const dialog = await openSettings(page, testInfo.project.name === "mobile-iphone");
  await expect(dialog).toBeVisible();

  const icon = page.locator("main ul").getByRole("link", { name: "Settings" });
  if (testInfo.project.name === "mobile-iphone") {
    await icon.click({ force: true });
  } else {
    await icon.dblclick();
  }
  await expect(page.getByRole("dialog", { name: "Settings" })).toHaveCount(1);
});

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

test("grid speed and icon size preferences control desktop layout", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile-iphone", "Desktop layout dimensions are asserted here");
  await page.setViewportSize({ width: 1280, height: 600 });
  await seedSettings(page, { ...NO_BOOT, gridSpeed: "slow", iconSize: "large" });
  await page.goto("/");

  await expect(page.locator("main ul").getByRole("link", { name: "Settings" })).toBeVisible();
  const grid = page.locator("main [data-horizon]");
  await expect(grid).toHaveAttribute("data-duration-ms", "16000");
  const reduced = testInfo.project.name === "reduced-motion";
  await expect(grid).toHaveAttribute("data-running", reduced ? "false" : "true");

  const icons = page.locator("main ul > li > a");
  await expect(icons).toHaveCount(7);
  for (const icon of await icons.all()) {
    expect(await icon.isVisible()).toBe(true);
    expect(await icon.evaluate((element) => element.tabIndex)).toBe(0);
    const box = await icon.locator("img").boundingBox();
    expect(box?.width).toBe(48);
    expect(box?.height).toBe(48);
  }

  await page.locator("main ul").getByRole("link", { name: "Settings" }).dblclick();
  await page.getByRole("radio", { name: "Paused" }).check();
  await expect(grid).toHaveAttribute("data-running", "false");
});

test("context menu theme toggle stays synchronized with Settings", async ({ page }, testInfo) => {
  await seedSettings(page, NO_BOOT);
  await page.goto("/");
  await page.locator("main").click({ button: "right", position: { x: 4, y: 4 } });
  await page.getByRole("menuitem", { name: "Dark Theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  const dialog = await openSettings(page, testInfo.project.name === "mobile-iphone");
  await expect(dialog.getByRole("radio", { name: "Dark" })).toBeChecked();
  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toContain('"theme":"dark"');
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("settings controls apply immediately and reset persisted values", async ({ page }, testInfo) => {
  await seedSettings(page, NO_BOOT);
  await page.goto("/");
  const dialog = await openSettings(page, testInfo.project.name === "mobile-iphone");

  await dialog.getByRole("radio", { name: "Dark" }).check();
  await dialog.getByRole("radio", { name: "Off" }).check();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("html")).toHaveAttribute("data-crt", "off");

  await dialog
    .getByRole("button", { name: "Reset to defaults" })
    .click({ force: testInfo.project.name === "mobile-iphone" });
  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBeNull();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.locator("html")).toHaveAttribute("data-crt", "subtle");
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
