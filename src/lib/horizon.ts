/**
 * Geometry for the synthwave floor, in canvas CSS pixels with y = 0 on the
 * horizon and y = height at the bottom edge of the screen.
 *
 * The floor is a flat plane seen from above: a line at depth `d` (the bottom
 * edge is depth 1) projects to `height / d`, so rows bunch toward the horizon
 * as real perspective does, and every vertical line runs to one vanishing
 * point on the horizon.
 */

/** Depth between consecutive rows. Smaller is denser. */
export const ROW_STEP = 0.5;
/** Rows closer than this many pixels to the horizon are not drawn. */
const MIN_ROW_GAP_PX = 2;

/** Screen y of a floor line at `depth`. */
export function rowY(depth: number, height: number): number {
  return height / depth;
}

/**
 * Depths of the rows to draw. `phase` in [0, 1) scrolls the floor toward the
 * viewer by one row per cycle; one row starts nearer than the bottom edge so
 * a new row slides in rather than popping.
 */
export function rowDepths(phase: number, height: number, step = ROW_STEP): number[] {
  const depths: number[] = [];
  const wrapped = ((phase % 1) + 1) % 1;
  for (let k = 0; ; k += 1) {
    const depth = 1 + (k - wrapped) * step;
    if (depth <= 0) continue;
    const y = rowY(depth, height);
    const next = rowY(depth + step, height);
    if (y - next < MIN_ROW_GAP_PX) break;
    depths.push(depth);
  }
  return depths;
}

/**
 * Bottom-edge x of every vertical line: evenly spaced around the vanishing
 * point, wide enough that the fan still covers the screen corners.
 */
export function columnBases(width: number, vanishX: number, spacing: number): number[] {
  const bases: number[] = [];
  const reach = width * 1.5;
  const count = Math.ceil(reach / spacing);
  for (let i = -count; i <= count; i += 1) bases.push(vanishX + i * spacing);
  return bases;
}

/** Column spacing at the bottom edge, narrowed on small screens so the fan still reads. */
export function columnSpacing(width: number, preferred: number): number {
  return Math.max(48, Math.min(preferred, width / 7));
}

/** Rows fade out into the horizon haze and are fully lit in the near half. */
export function rowAlpha(y: number, height: number): number {
  const t = Math.min(1, Math.max(0, (y / height - 0.02) / 0.45));
  return t * t * (3 - 2 * t);
}

/** Line weight grows toward the viewer. */
export function rowWidth(y: number, height: number): number {
  return 0.75 + 1.75 * Math.min(1, y / height);
}

/** Where a vertical line from the vanishing point to `baseX` crosses `y`. */
export function columnXAt(vanishX: number, baseX: number, y: number, height: number): number {
  return vanishX + (baseX - vanishX) * (y / height);
}

/** "#rrggbb" or "#rgb" to an rgba() string; anything else falls back to the given colour. */
export function withAlpha(hex: string, alpha: number, fallback = `rgba(255, 255, 255, ${alpha})`): string {
  const digits = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim())?.[1];
  if (!digits) return fallback;
  const full =
    digits.length === 3
      ? digits
          .split("")
          .map((c) => c + c)
          .join("")
      : digits;
  const n = Number.parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/** A CSS time value ("8s", "400ms") in milliseconds. */
export function parseDuration(value: string, fallback: number): number {
  const n = Number.parseFloat(value);
  if (Number.isNaN(n)) return fallback;
  return value.trim().endsWith("ms") ? n : n * 1000;
}

export interface HorizonBudget {
  /** Frames drawn per second; the loop skips the frames in between. */
  fps: number;
  /** Cap on the canvas backing-store scale. */
  maxDpr: number;
}

/**
 * Drawing budget for the floor. Touch devices and machines with few cores
 * draw at half rate and at 1x resolution; the floor scrolls slowly, so the
 * difference is hard to see but halves (or better) its cost.
 */
export function horizonBudget(device: { coarsePointer: boolean; cores: number | undefined }): HorizonBudget {
  const lowPower = device.coarsePointer || (device.cores !== undefined && device.cores <= 4);
  return lowPower ? { fps: 30, maxDpr: 1 } : { fps: 60, maxDpr: 2 };
}

/**
 * Whether the desktop wallpaper is hidden behind a window, so its floor need
 * not be drawn: a maximised window covers it, and on mobile every window is
 * full screen.
 */
export function wallpaperCovered(
  windows: readonly { minimized: boolean; maximized: boolean }[],
  mobile: boolean,
): boolean {
  return windows.some((w) => !w.minimized && (mobile || w.maximized));
}
