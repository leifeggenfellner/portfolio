import { describe, expect, it } from "vitest";
import {
  columnBases,
  columnSpacing,
  columnXAt,
  parseDuration,
  rowAlpha,
  rowDepths,
  rowY,
  withAlpha,
} from "@lib/horizon";

const H = 300;

describe("horizon geometry", () => {
  it("projects the near edge to the bottom and far rows toward the horizon", () => {
    expect(rowY(1, H)).toBe(H);
    expect(rowY(2, H)).toBe(H / 2);
    expect(rowY(1000, H)).toBeLessThan(1);
  });

  it("bunches rows toward the horizon", () => {
    const ys = rowDepths(0, H).map((d) => rowY(d, H));
    const gaps = ys.slice(1).map((y, i) => ys[i]! - y);
    for (let i = 1; i < gaps.length; i += 1) expect(gaps[i]!).toBeLessThan(gaps[i - 1]!);
    expect(gaps.at(-1)!).toBeGreaterThanOrEqual(2);
  });

  it("scrolls rows toward the viewer as the phase advances, and wraps", () => {
    const start = rowDepths(0, H);
    const later = rowDepths(0.5, H);
    expect(later[0]!).toBeLessThan(start[0]!);
    expect(rowDepths(1, H)).toEqual(start);
    expect(rowDepths(-0.25, H)).toEqual(rowDepths(0.75, H));
  });

  it("fans columns symmetrically around the vanishing point and covers the screen", () => {
    const bases = columnBases(1200, 600, 96);
    expect(bases).toContain(600);
    expect(Math.min(...bases)).toBeLessThan(0);
    expect(Math.max(...bases)).toBeGreaterThan(1200);
    expect(columnXAt(600, 900, 0, H)).toBe(600);
    expect(columnXAt(600, 900, H, H)).toBe(900);
  });

  it("narrows column spacing on small screens but keeps a floor", () => {
    expect(columnSpacing(1440, 96)).toBe(96);
    expect(columnSpacing(390, 96)).toBeCloseTo(390 / 7);
    expect(columnSpacing(200, 96)).toBe(48);
  });

  it("fades rows into the horizon", () => {
    expect(rowAlpha(0, H)).toBe(0);
    expect(rowAlpha(H, H)).toBe(1);
    expect(rowAlpha(H * 0.1, H)).toBeLessThan(rowAlpha(H * 0.3, H));
  });

  it("converts token colours and durations", () => {
    expect(withAlpha("#1fb6d6", 0.5)).toBe("rgba(31, 182, 214, 0.5)");
    expect(withAlpha("#fff", 1)).toBe("rgba(255, 255, 255, 1)");
    expect(withAlpha("color-mix(x)", 0.2, "fallback")).toBe("fallback");
    expect(parseDuration("8s", 0)).toBe(8000);
    expect(parseDuration("400ms", 0)).toBe(400);
    expect(parseDuration("", 123)).toBe(123);
  });
});
