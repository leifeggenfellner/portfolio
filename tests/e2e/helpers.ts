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

const SETTINGS_KEY = "retro-os:settings";
const HELP_NOTE_KEY = "retro-os:help-note";

/**
 * Skip the boot and, unless asked, the help note, so each test starts on a
 * quiet desktop. Parallel headless WebKit starves Web Animations, which can
 * leave a closed window's exit transition (Svelte, via Web Animations)
 * unfinished for seconds, so WebKit runs without motion; Chromium covers the
 * motion path. Capping WebKit's workers made this rarer, not gone: without
 * it, a theme change (degauss) followed by closing a window still failed in
 * about half of full runs once the suite grew.
 */
export async function openDesktop(page: Page, { withNote = false, settings = {} as Record<string, unknown> } = {}) {
  if (page.context().browser()?.browserType().name() === "webkit") {
    await page.emulateMedia({ reducedMotion: "reduce" });
  }
  await page.addInitScript(
    ({ settingsKey, noteKey, dismissNote, extra }) => {
      if (sessionStorage.getItem("shell-seeded") === "true") return;
      sessionStorage.setItem("shell-seeded", "true");
      localStorage.setItem(settingsKey, JSON.stringify({ bootAnimation: false, ...extra }));
      if (dismissNote) localStorage.setItem(noteKey, "dismissed");
    },
    { settingsKey: SETTINGS_KEY, noteKey: HELP_NOTE_KEY, dismissNote: !withNote, extra: settings },
  );
  await page.goto("/");
  await expect(page.getByRole("navigation", { name: "Taskbar" })).toBeVisible();
}

/** Open a desktop app from its icon with the keyboard, which works on every project. */
export async function openApp(page: Page, appId: string) {
  await page.locator(`[data-app-id="${appId}"]`).focus();
  await page.keyboard.press("Enter");
  const win = page.locator(`[data-window-id="${appId}"]`);
  await expect(win).toBeVisible();
  return win;
}
