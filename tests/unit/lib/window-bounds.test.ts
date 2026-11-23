import { describe, expect, it } from "vitest";
import {
  clampWindowPosition,
  FIT_MARGIN,
  fitWindowToViewport,
  GRAB_MARGIN,
  TITLE_BAR_HEIGHT,
} from "@lib/window-bounds";

const viewport = { width: 1000, height: 700 };

describe("clampWindowPosition", () => {
  it("leaves positions inside the viewport untouched", () => {
    expect(clampWindowPosition(120, 80, 400, viewport)).toEqual({ x: 120, y: 80 });
  });

  it("keeps a grab margin of the title bar on screen horizontally", () => {
    expect(clampWindowPosition(-900, 10, 400, viewport).x).toBe(GRAB_MARGIN - 400);
    expect(clampWindowPosition(5000, 10, 400, viewport).x).toBe(viewport.width - GRAB_MARGIN);
  });

  it("never lets the title bar leave the top or slide under the bottom edge", () => {
    expect(clampWindowPosition(0, -50, 400, viewport).y).toBe(0);
    expect(clampWindowPosition(0, 5000, 400, viewport).y).toBe(viewport.height - TITLE_BAR_HEIGHT);
  });
});

describe("fitWindowToViewport", () => {
  it("leaves a box that fits untouched", () => {
    const box = { x: 220, y: 90, w: 720, h: 460 };
    expect(fitWindowToViewport(box, viewport)).toEqual(box);
  });

  it("slides a box that overhangs the right or bottom edge back on screen", () => {
    expect(fitWindowToViewport({ x: 600, y: 500, w: 500, h: 300 }, viewport)).toEqual({
      x: viewport.width - 500 - FIT_MARGIN,
      y: viewport.height - 300 - FIT_MARGIN,
      w: 500,
      h: 300,
    });
  });

  it("shrinks a box larger than the viewport to fit inside the margins", () => {
    const small = { width: 800, height: 500 };
    expect(fitWindowToViewport({ x: 220, y: 90, w: 900, h: 600 }, small)).toEqual({
      x: FIT_MARGIN,
      y: FIT_MARGIN,
      w: small.width - 2 * FIT_MARGIN,
      h: small.height - 2 * FIT_MARGIN,
    });
  });
});
