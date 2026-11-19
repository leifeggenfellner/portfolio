import { describe, expect, it } from "vitest";
import { clampWindowPosition, GRAB_MARGIN, TITLE_BAR_HEIGHT } from "@lib/window-bounds";

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
