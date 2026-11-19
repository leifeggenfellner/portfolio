import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { PROFILE } from "../../src/content/profile";
import { openApp, openDesktop } from "./helpers";
import type { Locator } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await openDesktop(page);
});

test.describe("terminal", () => {
  async function run(input: Locator, command: string) {
    await input.fill(command);
    await input.press("Enter");
  }

  test("runs commands over the virtual filesystem", async ({ page }) => {
    const win = await openApp(page, "terminal");
    const input = win.getByRole("textbox");
    await expect(input).toBeFocused();
    const log = win.getByRole("log");

    await run(input, "cat about.txt");
    await expect(log).toContainText(PROFILE.name);
    await run(input, "cd projects");
    await expect(win.getByText("leif@retro:~/projects$", { exact: true })).toBeVisible();
    await run(input, "ls");
    await expect(log).toContainText("retro-os.prj");
    await run(input, "nope");
    await expect(log).toContainText("nope: command not found");
  });

  test("completes with Tab and walks history with the arrow keys", async ({ page }) => {
    const win = await openApp(page, "terminal");
    const input = win.getByRole("textbox");
    await input.fill("neo");
    await input.press("Tab");
    await expect(input).toHaveValue("neofetch ");
    await input.press("Enter");
    await expect(win.getByRole("log")).toContainText("Uptime:");
    await input.press("ArrowUp");
    await expect(input).toHaveValue("neofetch ");
  });

  test("changes settings, opens apps and exits", async ({ page }) => {
    const win = await openApp(page, "terminal");
    const input = win.getByRole("textbox");
    await run(input, "theme dark");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await run(input, "open minesweeper");
    await expect(page.locator('[data-window-id="minigame"]')).toBeVisible();
    await page.locator('[data-window-id="terminal"]').getByRole("textbox").focus();
    await run(page.locator('[data-window-id="terminal"]').getByRole("textbox"), "exit");
    await expect(page.locator('[data-window-id="terminal"]')).toHaveCount(0);
  });
});

test.describe("minesweeper", () => {
  test("first click is safe, flags count down, the face restarts", async ({ page }) => {
    const win = await openApp(page, "minigame");
    const status = win.locator("p[aria-live]");
    await expect(status).toContainText("Open any square");

    await win.locator('[data-cell="40"]').click();
    await expect(status).not.toContainText("Boom");
    await expect(win.locator('[data-cell="40"]')).not.toHaveAttribute("aria-label", /hidden/);

    const hidden = win.locator('[data-cell][aria-label$="hidden"]').first();
    await hidden.focus();
    await page.keyboard.press("f");
    await expect(win.getByRole("status")).toHaveAttribute("aria-label", "9 mines left");

    await win.getByRole("button", { name: "New game" }).click();
    await expect(status).toContainText("Open any square");
    await expect(win.locator('[data-cell][aria-label$="hidden"]')).toHaveCount(81);
  });

  test("is playable from the keyboard", async ({ page }) => {
    const win = await openApp(page, "minigame");
    const cell = win.locator('[data-cell="40"]');
    await cell.focus();
    await page.keyboard.press("ArrowRight");
    await expect(win.locator('[data-cell="41"]')).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(win.locator('[data-cell="41"]')).not.toHaveAttribute("aria-label", /hidden/);
  });
});

test.describe("projects", () => {
  test("browses folders, opens a project and launches apps from C:", async ({ page }) => {
    const win = await openApp(page, "projects");
    const file = win.getByRole("button", { name: "retro-os.prj" });
    await file.focus();
    await page.keyboard.press("Enter");
    await expect(win.getByRole("heading", { name: "Retro" })).toBeVisible();
    await expect(win.getByRole("link", { name: "Source" })).toHaveAttribute("href", /github\.com/);

    await win.getByRole("button", { name: "Back" }).click();
    await expect(file).toBeVisible();
    await win.getByRole("button", { name: "Up one level" }).click();
    await expect(win.getByText("C:\\", { exact: true })).toBeVisible();

    await win.getByRole("button", { name: "Me.txt" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.locator('[data-window-id="about"]')).toBeVisible();
  });
});

test.describe("contact", () => {
  test("links out to the profiles", async ({ page }) => {
    const win = await openApp(page, "contact");
    for (const link of PROFILE.links) {
      await expect(win.getByRole("link", { name: link.label })).toHaveAttribute("href", link.url);
    }
  });

  test("validates the message before handing off to the mail app", async ({ page }) => {
    test.skip(!PROFILE.email, "no mail address published yet");
    const win = await openApp(page, "contact");
    await win.getByRole("button", { name: "Send" }).click();
    await expect(win.getByText("Write a message first.")).toBeVisible();
    await expect(win.getByRole("textbox", { name: "Message" })).toBeFocused();
  });
});

test.describe("static apps", () => {
  test("Me.txt and the Skills Matrix render their content", async ({ page }) => {
    const about = await openApp(page, "about");
    await expect(about.getByRole("heading", { name: PROFILE.name })).toBeVisible();
    const skills = await openApp(page, "skills");
    await expect(skills.getByRole("table").first()).toBeVisible();
    await expect(skills.getByRole("rowheader", { name: "Svelte 5" })).toBeVisible();
  });
});

test("every app window passes axe", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop", "one engine is enough for the audit");
  for (const id of ["about", "projects", "terminal", "skills", "contact", "minigame", "settings"]) {
    await openApp(page, id);
    const results = await new AxeBuilder({ page })
      .include(`[data-window-id="${id}"]`)
      .withTags(["wcag2a", "wcag2aa"])
      .disableRules(["color-contrast"])
      .analyze();
    expect(results.violations, id).toEqual([]);
    await page.keyboard.press("Escape");
  }
});
