/**
 * Idle detection for the screensaver. Any pointer, key, wheel or touch
 * activity resets the countdown; `onIdle` fires once the window has been
 * quiet for `timeoutMs`, and `onActive` on the first activity after that.
 */

const ACTIVITY_EVENTS = ["pointermove", "pointerdown", "keydown", "wheel", "touchstart"] as const;

export interface IdleOptions {
  timeoutMs: number;
  onIdle(): void;
  onActive(): void;
  /** Checked when the timer fires; returning false postpones idling for another full timeout. */
  canIdle?(): boolean;
  target?: EventTarget;
}

/** Start watching for idleness. Returns a function that stops it. */
export function watchIdle({ timeoutMs, onIdle, onActive, canIdle = () => true, target = window }: IdleOptions) {
  let idle = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  function arm() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (!canIdle()) {
        arm();
        return;
      }
      idle = true;
      onIdle();
    }, timeoutMs);
  }

  function activity() {
    if (idle) {
      idle = false;
      onActive();
    }
    arm();
  }

  // Capture phase, so an app stopping propagation still counts as activity.
  for (const type of ACTIVITY_EVENTS) target.addEventListener(type, activity, { capture: true, passive: true });
  arm();

  return () => {
    clearTimeout(timer);
    for (const type of ACTIVITY_EVENTS) target.removeEventListener(type, activity, { capture: true });
  };
}

/**
 * True while focus is in a text field holding a draft, such as a half-written
 * message. An empty field, like the terminal's idle prompt, doesn't count.
 */
export function isDrafting(doc: Document = document): boolean {
  const el = doc.activeElement;
  if (el instanceof HTMLTextAreaElement) return el.value !== "";
  if (el instanceof HTMLInputElement) {
    return !["checkbox", "radio", "button", "submit", "range"].includes(el.type) && el.value !== "";
  }
  return el instanceof HTMLElement && el.isContentEditable;
}
