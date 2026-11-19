/**
 * Remembers whether the visitor dismissed the desktop help note. Storage can
 * be unavailable (private mode, blocked site data), in which case the note
 * simply shows again next visit.
 */
export const HELP_NOTE_STORAGE_KEY = "retro-os:help-note";

export function isHelpNoteDismissed(): boolean {
  try {
    return localStorage.getItem(HELP_NOTE_STORAGE_KEY) === "dismissed";
  } catch {
    return false;
  }
}

export function dismissHelpNote(): void {
  try {
    localStorage.setItem(HELP_NOTE_STORAGE_KEY, "dismissed");
  } catch {
    // Storage blocked: the note returns next visit, which is harmless.
  }
}
