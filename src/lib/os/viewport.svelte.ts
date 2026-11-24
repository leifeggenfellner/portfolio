/**
 * What the shell needs to know about the screen, as reactive values behind
 * one set of listeners. Before `listen()` (and on the server) it reports a
 * desktop-sized default, so server and first client render agree.
 */
export const MOBILE_QUERY = "(max-width: 768px)";
const FALLBACK_TASKBAR_HEIGHT = 36;

export class Viewport {
  width = $state(0);
  height = $state(0);
  taskbarHeight = $state(FALLBACK_TASKBAR_HEIGHT);
  mobile = $state(false);
  coarsePointer = $state(false);
  reducedMotion = $state(false);

  /** The desktop above the taskbar, where windows live. */
  get area(): { width: number; height: number } {
    return { width: this.width, height: this.height - this.taskbarHeight };
  }

  #sync = () => {
    this.mobile = window.matchMedia(MOBILE_QUERY).matches;
    this.coarsePointer = window.matchMedia("(pointer: coarse)").matches;
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    const css = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--taskbar-height"));
    this.taskbarHeight = Number.isNaN(css) ? FALLBACK_TASKBAR_HEIGHT : css;
  };

  /** Read the screen now and on every change; returns the function that stops. */
  listen(): () => void {
    this.#sync();
    const queries = [MOBILE_QUERY, "(pointer: coarse)", "(prefers-reduced-motion: reduce)"].map((q) =>
      window.matchMedia(q),
    );
    for (const q of queries) q.addEventListener("change", this.#sync);
    window.addEventListener("resize", this.#sync);
    return () => {
      for (const q of queries) q.removeEventListener("change", this.#sync);
      window.removeEventListener("resize", this.#sync);
    };
  }
}
