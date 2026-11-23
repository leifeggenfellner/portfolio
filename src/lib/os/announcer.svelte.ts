/**
 * One polite live region for the whole desktop. Window and system events
 * (opened, closed, snapped, theme changed) go through here instead of
 * ad-hoc aria-live regions, so screen readers hear one voice.
 *
 * A burst keeps only its last message, and the region is cleared before
 * each message so the same text twice (closing two windows of one app)
 * is read twice.
 */

/** Bursts within this window collapse into their last message. */
export const ANNOUNCE_DEBOUNCE_MS = 150;

export class Announcer {
  /** What the live region currently says. */
  message = $state("");
  #timer: ReturnType<typeof setTimeout> | undefined;

  announce(text: string): void {
    clearTimeout(this.#timer);
    this.message = "";
    this.#timer = setTimeout(() => (this.message = text), ANNOUNCE_DEBOUNCE_MS);
  }
}
