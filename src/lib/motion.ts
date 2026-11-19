/**
 * Motion helpers for JS-driven animation. Durations and easing come from the
 * tokens in tokens.css so CSS and JS motion stay in step.
 */

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function readToken(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** A duration token such as `--dur-2` in milliseconds, or the fallback if it is unset. */
export function durationMs(name: string, fallback: number): number {
  const raw = readToken(name);
  const value = Number.parseFloat(raw);
  if (Number.isNaN(value)) return fallback;
  return raw.endsWith("ms") ? value : value * 1000;
}

/** An easing token such as `--ease-out`, for the Web Animations API. */
export function easing(name: string, fallback = "ease-out"): string {
  return readToken(name) || fallback;
}
