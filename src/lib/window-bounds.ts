/**
 * Keeps a dragged window reachable. The title bar may slide partly off the
 * left and right edges, but enough of it always stays on screen to grab, and
 * it never goes above the top edge or under the taskbar.
 */
export interface Viewport {
  width: number;
  height: number;
}

/** Pixels of title bar that must stay visible horizontally. */
export const GRAB_MARGIN = 96;
/** Height of the window title bar, so it can't slide under the taskbar. */
export const TITLE_BAR_HEIGHT = 28;

export function clampWindowPosition(x: number, y: number, width: number, viewport: Viewport) {
  const minX = Math.min(0, GRAB_MARGIN - width);
  const maxX = Math.max(0, viewport.width - GRAB_MARGIN);
  const maxY = Math.max(0, viewport.height - TITLE_BAR_HEIGHT);
  return {
    x: Math.min(Math.max(x, minX), maxX),
    y: Math.min(Math.max(y, 0), maxY),
  };
}
