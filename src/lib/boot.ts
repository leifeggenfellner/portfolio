/**
 * Boot pacing. A first visit gets the whole show; a returning visitor gets a
 * short power-on so the desktop is never more than about a second away.
 */
export const VISITED_STORAGE_KEY = "retro-os:visited";

/** Splash length (sun rise plus floor power-on) on a first visit. */
export const FIRST_SPLASH_MS = 1600;
/** Splash length for a returning visitor: the floor powers on, the sun is already up. */
export const RETURN_SPLASH_MS = 900;
/** The longest the BIOS waits for its loading (fonts, app code) before going on without it. */
export const BIOS_DEADLINE_MS = 3000;

export function hasVisited(): boolean {
  try {
    return localStorage.getItem(VISITED_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function markVisited(): void {
  try {
    localStorage.setItem(VISITED_STORAGE_KEY, "true");
  } catch {
    // Storage blocked: the next visit replays the full boot, which is harmless.
  }
}
