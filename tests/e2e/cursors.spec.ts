import { expect, test } from "@playwright/test";
import { openApp, openDesktop } from "./helpers";
import type { Locator } from "@playwright/test";

const cursorOf = (el: Locator) => el.evaluate((node) => getComputedStyle(node).cursor);

test("pixel-art cursors on a fine pointer, each with a keyword fallback", async ({ page, isMobile }) => {
  test.skip(isMobile, "touch devices keep the platform cursor");
  await openDesktop(page);
  const html = page.locator("html");
  await expect(html).toHaveAttribute("data-cursors", "retro");

  // [element, keyword the image falls back to]
  const cases: [Locator, string][] = [
    [page.locator("main"), "default"],
    [page.locator('button[data-app-id="about"]'), "pointer"],
  ];
  const term = await openApp(page, "terminal");
  cases.push([term.getByRole("textbox"), "text"], [term.getByRole("toolbar", { name: "Window header" }), "move"]);
  cases.push([term.getByRole("button", { name: "Resize window" }), "nwse-resize"]);
  for (const [el, keyword] of cases) {
    const cursor = await cursorOf(el);
    expect(cursor).toContain("url(");
    expect(cursor.slice(-30), keyword).toMatch(new RegExp(`, ${keyword}$`));
  }
});

test("the System cursor setting and touch devices keep the platform cursors", async ({ page, isMobile }) => {
  await openDesktop(page, { settings: isMobile ? {} : { cursors: "system" } });
  for (const el of [page.locator("main"), page.locator('button[data-app-id="about"]')]) {
    expect(await cursorOf(el)).not.toContain("url(");
  }
});

test("Settings toggles the pixel-art cursors", async ({ page, isMobile }) => {
  test.skip(isMobile, "touch devices keep the platform cursor");
  await openDesktop(page);
  const settings = await openApp(page, "settings");
  const toggle = settings.getByRole("checkbox", { name: "Pixel-art cursors" });
  await expect(toggle).toBeChecked();
  await toggle.uncheck();
  await expect(page.locator("html")).toHaveAttribute("data-cursors", "system");
  expect(await cursorOf(page.locator("main"))).not.toContain("url(");
});
