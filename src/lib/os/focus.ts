/**
 * Where keyboard focus goes inside a window. The window manager remembers
 * the last element focused in each window's body; these turn that into DOM
 * focus.
 */
import type { WindowManager } from "./window-manager.svelte";

export function windowElement(id: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-window-id="${id}"]`);
}

/** Where focus goes when a window activates: where it was, else the app's `data-autofocus`, else the frame. */
export function focusTargetFor(windows: WindowManager, win: HTMLElement): HTMLElement {
  const remembered = windows.rememberedFocus(win.dataset.windowId ?? "");
  if (remembered && win.contains(remembered)) return remembered;
  return win.querySelector<HTMLElement>("[data-window-body] [data-autofocus]") ?? win;
}

/** Put focus where the window was working, if it is on screen. */
export function focusWindow(windows: WindowManager, id: string): void {
  const win = windowElement(id);
  if (win) focusTargetFor(windows, win).focus({ preventScroll: true });
}
