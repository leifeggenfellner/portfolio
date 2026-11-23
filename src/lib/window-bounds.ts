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

/** Gap kept between a newly opened window and the viewport edges. */
export const FIT_MARGIN = 8;

export interface WindowBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Shrinks a window's default box to fit the viewport and slides it fully on
 * screen, so a large default (the Terminal's) still opens whole on a small
 * screen. Boxes that already fit are returned unchanged.
 */
export function fitWindowToViewport(box: WindowBox, viewport: Viewport): WindowBox {
  const w = Math.max(0, Math.min(box.w, viewport.width - 2 * FIT_MARGIN));
  const h = Math.max(0, Math.min(box.h, viewport.height - 2 * FIT_MARGIN));
  return {
    x: Math.max(FIT_MARGIN, Math.min(box.x, viewport.width - w - FIT_MARGIN)),
    y: Math.max(FIT_MARGIN, Math.min(box.y, viewport.height - h - FIT_MARGIN)),
    w,
    h,
  };
}

export function clampWindowPosition(x: number, y: number, width: number, viewport: Viewport) {
  const minX = Math.min(0, GRAB_MARGIN - width);
  const maxX = Math.max(0, viewport.width - GRAB_MARGIN);
  const maxY = Math.max(0, viewport.height - TITLE_BAR_HEIGHT);
  return {
    x: Math.min(Math.max(x, minX), maxX),
    y: Math.min(Math.max(y, 0), maxY),
  };
}
