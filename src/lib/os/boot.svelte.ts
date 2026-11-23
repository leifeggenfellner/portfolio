/**
 * The boot sequence as a phase machine:
 *
 *   pending → bios → splash → leaving → desktop   (first visit)
 *   pending → splash → leaving → desktop          (returning)
 *   pending → desktop                             (boot animation off)
 *
 * `pending` is the server render and the moment before hydration. Skipping
 * from any phase lands on the desktop. Leaving the splash is timed, not tied
 * to its fade finishing, so a starved animation can never leave the boot
 * screen covering the desktop.
 */
import { hasVisited, markVisited } from "@lib/boot";

export type BootPhase = "pending" | "bios" | "splash" | "leaving" | "desktop";

export class Boot {
  phase = $state<BootPhase>("pending");
  /** A returning visitor gets the short splash. */
  returning = $state(false);
  #leaveTimer: ReturnType<typeof setTimeout> | undefined;

  /** True while a boot screen is up and keys should skip it. */
  get running(): boolean {
    return this.phase === "bios" || this.phase === "splash" || this.phase === "leaving";
  }

  start(animate: boolean): void {
    if (this.phase !== "pending") return;
    if (!animate) return this.finish();
    this.returning = hasVisited();
    this.phase = this.returning ? "splash" : "bios";
  }

  biosDone(): void {
    if (this.phase === "bios") this.phase = "splash";
  }

  /** Fade the splash out over the desktop, then remove it after `afterMs` whatever the animation does. */
  leaveSplash(afterMs: number): void {
    if (this.phase !== "splash") return;
    this.phase = "leaving";
    this.#leaveTimer = setTimeout(() => this.finish(), afterMs);
  }

  finish(): void {
    clearTimeout(this.#leaveTimer);
    if (this.phase === "desktop") return;
    markVisited();
    this.phase = "desktop";
  }
}
