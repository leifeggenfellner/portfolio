import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const STORAGE_KEY = "retro-os:settings";
const NO_BOOT = { bootAnimation: false };

async function seedSettings(page: Page, settings: object) {
  await page.addInitScript(
    ({ key, value }) => {
      localStorage.setItem(key, JSON.stringify(value));
    },
    { key: STORAGE_KEY, value: settings },
  );
}

async function openDesktop(page: Page, settings: object = NO_BOOT) {
  await seedSettings(page, settings);
  await page.goto("/");
  await expect(page.locator("main ul").getByRole("button", { name: "Settings" })).toBeVisible();
}

test.describe("synthwave grid", () => {
  test("keeps the grid plane fixed while its texture travels", async ({ page }) => {
    test.skip(
      ["mobile-iphone", "reduced-motion"].includes(test.info().project.name),
      "Phase geometry is covered by the mobile bounds test; reduced motion intentionally settles the animation",
    );
    await page.setViewportSize({ width: 1280, height: 720 });
    await openDesktop(page);

    const grid = page.locator(".outrun-grid");
    const plane = page.locator(".outrun-grid-plane");
    await expect(grid).toBeVisible();

    const initial = await page.evaluate(() => {
      const grid = document.querySelector<HTMLElement>(".outrun-grid");
      const plane = document.querySelector<HTMLElement>(".outrun-grid-plane");
      if (!grid || !plane) throw new Error("Grid elements are missing");
      return {
        gridAnimation: grid.getAnimations()[0],
        gridTransform: getComputedStyle(grid).transform,
        planeTransform: getComputedStyle(plane).transform,
        planeRect: plane.getBoundingClientRect().toJSON(),
        gridRect: grid.getBoundingClientRect().toJSON(),
      };
    });

    expect(initial.gridAnimation).toBeTruthy();
    expect(initial.planeTransform).not.toBe("none");
    expect(initial.gridRect.height).toBeGreaterThan(initial.planeRect.height);

    await page.evaluate(() => {
      const animation = document.querySelector<HTMLElement>(".outrun-grid")?.getAnimations()[0];
      if (!animation) throw new Error("Grid animation is missing");
      animation.pause();
      animation.currentTime = 0;
    });
    const start = await grid.evaluate((element) => getComputedStyle(element).transform);

    await page.evaluate(() => {
      const animation = document.querySelector<HTMLElement>(".outrun-grid")?.getAnimations()[0];
      if (!animation) throw new Error("Grid animation is missing");
      animation.currentTime = (animation.effect?.getComputedTiming().duration as number) / 2;
    });
    const midpoint = await grid.evaluate((element) => getComputedStyle(element).transform);
    const planeAtMidpoint = await plane.evaluate((element) => getComputedStyle(element).transform);

    expect(midpoint).not.toBe(start);
    expect(planeAtMidpoint).toBe(initial.planeTransform);
  });

  test("covers desktop and mobile floor bounds without horizontal overflow", async ({ page }) => {
    await openDesktop(page);
    const grid = page.locator(".outrun-grid");
    const plane = page.locator(".outrun-grid-plane");

    for (const viewport of [
      { width: 1280, height: 720 },
      { width: 390, height: 844 },
      { width: 844, height: 390 },
    ]) {
      await page.setViewportSize(viewport);
      const bounds = await plane.evaluate((element) => {
        const planeRect = element.getBoundingClientRect();
        const gridRect = document.querySelector<HTMLElement>(".outrun-grid")?.getBoundingClientRect();
        return {
          plane: planeRect.toJSON(),
          grid: gridRect?.toJSON(),
          scrollWidth: document.documentElement.scrollWidth,
          viewportWidth: window.innerWidth,
        };
      });

      expect(bounds.plane.bottom).toBeGreaterThanOrEqual(viewport.height - 1);
      expect(bounds.grid?.height).toBeGreaterThan(bounds.plane.height);
      expect(bounds.scrollWidth).toBeLessThanOrEqual(bounds.viewportWidth);
    }

    await expect(grid).toBeVisible();
  });

  test("preserves normal, paused, and reduced-motion contracts", async ({ page }, testInfo) => {
    await openDesktop(page, { ...NO_BOOT, gridSpeed: "fast" });
    const grid = page.locator(".outrun-grid");

    if (testInfo.project.name === "reduced-motion") {
      await expect
        .poll(() => grid.evaluate((element) => Number.parseFloat(getComputedStyle(element).animationDuration)))
        .toBeLessThanOrEqual(0.001);
      await expect.poll(() => grid.evaluate((element) => getComputedStyle(element).animationIterationCount)).toBe("1");
      return;
    }

    await expect.poll(() => grid.evaluate((element) => getComputedStyle(element).animationDuration)).toBe("4s");
    await expect.poll(() => grid.evaluate((element) => getComputedStyle(element).animationPlayState)).toBe("running");

    await page.locator("main ul").getByRole("button", { name: "Settings" }).dblclick();
    await page.getByRole("radio", { name: "Paused" }).check();
    await expect.poll(() => grid.evaluate((element) => getComputedStyle(element).animationPlayState)).toBe("paused");
  });

  test("keeps the splash decorative and present before boot advances", async ({ page }) => {
    await page.clock.install();
    await seedSettings(page, { bootAnimation: true });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.clock.runFor(100);

    const splash = page.locator(".outrun-splash-root");
    await expect(splash).toBeVisible();
    const splashState = await splash.evaluate((element) => ({
      label: element.getAttribute("aria-label"),
      gridHidden: element.querySelector(".outrun-grid-plane")?.getAttribute("aria-hidden"),
    }));
    expect(splashState).toEqual({ label: "Booting RetroOS", gridHidden: "true" });
  });
});
