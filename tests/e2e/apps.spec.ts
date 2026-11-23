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

  test("tells fortunes, lets the monitor talk and has a manual", async ({ page }) => {
    const win = await openApp(page, "terminal");
    const input = win.getByRole("textbox");
    const log = win.getByRole("log");
    await run(input, "fortune");
    await run(input, "cowsay hello there");
    await expect(log).toContainText("< hello there >");
    await run(input, "man matrix");
    await expect(log).toContainText("MATRIX(1)");
  });

  test("rains until a key is pressed, and that key doesn't reach the prompt", async ({ page }) => {
    const win = await openApp(page, "terminal");
    const input = win.getByRole("textbox");
    await run(input, "matrix");
    const rain = win.locator("[data-matrix]");
    if (await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)) {
      await expect(win.getByRole("log")).toContainText("matrix: skipped, reduced motion is on.");
      await expect(rain).toHaveCount(0);
      return;
    }
    await expect(rain).toBeVisible();
    await page.keyboard.press("q");
    await expect(rain).toHaveCount(0);
    await expect(input).toBeFocused();
    await expect(input).toHaveValue("");
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

test.describe("focus stack", () => {
  test.skip(
    ({ isMobile }) => isMobile,
    "Mobile windows are full screen; the title bar and sizes are desktop behaviour",
  );

  test("closing a window opened from the Terminal puts typing back in the prompt", async ({ page }) => {
    const term = await openApp(page, "terminal");
    const input = term.getByRole("textbox");
    await input.fill("open minesweeper");
    await input.press("Enter");
    const mines = page.locator('[data-window-id="minigame"]');
    await expect(mines).toBeVisible();
    await mines.focus();
    await page.keyboard.press("Escape");
    await expect(mines).toHaveCount(0);
    await expect(input).toBeFocused();
    await page.keyboard.type("ls");
    await expect(input).toHaveValue("ls");
  });

  test("clicking the Terminal's title bar focuses the prompt", async ({ page }) => {
    const term = await openApp(page, "terminal");
    const input = term.getByRole("textbox");
    await page.locator('nav[aria-label="Taskbar"] button').first().focus();
    await expect(input).not.toBeFocused();
    await term.getByText("Terminal", { exact: true }).first().click();
    await expect(input).toBeFocused();
  });

  test("re-activating a window restores the element focused inside it", async ({ page }) => {
    const contact = await openApp(page, "contact");
    const subject = contact.getByLabel("Subject");
    await subject.focus();
    await openApp(page, "settings");
    await page.keyboard.press("Escape");
    await expect(page.locator('[data-window-id="settings"]')).toHaveCount(0);
    await expect(subject).toBeFocused();
  });

  test("opens the Terminal large, but never past the viewport", async ({ page }) => {
    await page.setViewportSize({ width: 820, height: 560 });
    const term = await openApp(page, "terminal");
    // Measured once the opening transition has settled.
    await expect(async () => {
      const box = await term.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(820);
      expect(box!.width).toBeGreaterThan(700);
    }).toPass();
  });
});

test.describe("crash containment", () => {
  test("a crashing app shows its blue screen, and nothing else breaks", async ({ page }) => {
    const contact = await openApp(page, "contact");
    const term = await openApp(page, "terminal");
    const input = term.getByRole("textbox");
    await input.fill("panic");
    await input.press("Enter");

    const crash = term.getByRole("alert");
    await expect(crash).toContainText("Terminal");
    await expect(crash).toContainText("Error");
    await expect(term.getByRole("button", { name: "Restart app" })).toBeFocused();

    // The rest of the desktop still works.
    await expect(contact).toBeVisible();
    await openApp(page, "settings");
    await page.keyboard.press("Escape");
    await expect(page.locator('[data-window-id="settings"]')).toHaveCount(0);

    await term.getByRole("button", { name: "Restart app" }).click();
    await expect(crash).toHaveCount(0);
    await expect(term.getByRole("textbox")).toBeVisible();

    await term.getByRole("textbox").fill("panic");
    await term.getByRole("textbox").press("Enter");
    await term.getByRole("alert").getByRole("button", { name: "Close" }).click();
    await expect(term).toHaveCount(0);
  });

  test("the blue screen has no axe violations", async ({ page }) => {
    const term = await openApp(page, "terminal");
    await term.getByRole("textbox").fill("panic");
    await term.getByRole("textbox").press("Enter");
    await expect(term.getByRole("alert")).toBeVisible();
    const results = await new AxeBuilder({ page }).include('[data-window-id="terminal"]').analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe("minesweeper", () => {
  test("first click is safe, flags count down, the face restarts", async ({ page }) => {
    const win = await openApp(page, "minigame");
    const status = win.locator("p[aria-live]");
    await expect(status).toContainText("Right-click or F flags");

    await win.locator('[data-cell="40"]').click();
    await expect(status).not.toContainText("Boom");
    await expect(win.locator('[data-cell="40"]')).not.toHaveAttribute("aria-label", /hidden/);

    const hidden = win.locator('[data-cell][aria-label$="hidden"]').first();
    await hidden.focus();
    await page.keyboard.press("f");
    await expect(win.getByRole("status")).toHaveAttribute("aria-label", "9 mines left");

    const flagMode = win.getByRole("button", { name: "Flag mode" });
    await flagMode.click();
    await expect(flagMode).toHaveAttribute("aria-pressed", "true");
    await win.getByRole("button", { name: "New game" }).click();
    await expect(flagMode).toHaveAttribute("aria-pressed", "false");
    await expect(status).toContainText("Right-click or F flags");
    await expect(win.locator('[data-cell][aria-label$="hidden"]')).toHaveCount(81);
  });

  test("F flags the hovered cell, not the last one clicked", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "mobile-iphone", "hover needs a mouse");
    const win = await openApp(page, "minigame");
    await win.locator('[data-cell="40"]').click();
    const hidden = win.locator('[data-cell][aria-label$="hidden"]');
    const first = hidden.first();
    const id = await first.getAttribute("data-cell");
    // Focus stays on the clicked cell; only the pointer moves.
    await first.hover();
    await page.keyboard.press("f");
    await expect(win.locator(`[data-cell="${id}"]`)).toHaveAttribute("aria-label", /flagged$/);
    await expect(win.locator('[data-cell="40"]')).not.toHaveAttribute("aria-label", /flagged$/);
    await page.keyboard.press("Control+f");
    await expect(win.locator(`[data-cell="${id}"]`)).toHaveAttribute("aria-label", /flagged$/);
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

for (const theme of ["light", "dark"]) {
  test(`every app window passes axe, contrast included (${theme})`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "one engine is enough for the audit");
    // beforeEach already seeded storage, so set the theme there and reload.
    await page.evaluate((value) => {
      const key = "retro-os:settings";
      const stored = JSON.parse(localStorage.getItem(key) ?? "{}");
      localStorage.setItem(key, JSON.stringify({ ...stored, theme: value }));
    }, theme);
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    for (const id of ["about", "projects", "terminal", "skills", "contact", "minigame", "settings"]) {
      const win = await openApp(page, id);
      // A window fades in over the wallpaper; measure contrast once it is opaque.
      await expect.poll(() => win.evaluate((el) => el.getAnimations().length)).toBe(0);
      const results = await new AxeBuilder({ page })
        .include(`[data-window-id="${id}"]`)
        .withTags(["wcag2a", "wcag2aa"])
        .analyze();
      expect(results.violations, id).toEqual([]);
      await page.keyboard.press("Escape");
    }
  });
}
