/**
 * Motion helpers. Durations and easing come from the tokens in tokens.css so
 * CSS and JS motion stay in step; every Svelte enter/exit goes through
 * `motion()`, which respects reduced motion and always ends.
 */
import { expoOut } from "svelte/easing";
import type { TransitionConfig } from "svelte/transition";

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

/** How long past its duration a transition may run before it is finished by hand. */
export const MOTION_GRACE_MS = 120;

export interface Motion {
  /** A duration token, e.g. `--dur-2`, and the fallback when it can't be read. */
  duration: readonly [token: string, fallbackMs: number];
  /** As Svelte's transition `css`: t runs 0→1 on enter and 1→0 on exit; u = 1 − t. */
  css: (t: number, u: number) => string;
  easing?: (t: number) => number;
}

/** The Web Animations Svelte starts for a transition: plain animations, not the element's own CSS ones. */
function transitionAnimations(node: Element): Animation[] {
  const own = (a: Animation) =>
    (typeof CSSAnimation !== "undefined" && a instanceof CSSAnimation) ||
    (typeof CSSTransition !== "undefined" && a instanceof CSSTransition);
  return (node.getAnimations?.() ?? []).filter((a) => !own(a));
}

/**
 * Settle a transition's animations if they are still running `afterMs` from
 * now. When frames are starved (a busy or background tab, headless WebKit
 * under load) Web Animations can stall, and Svelte only removes a closed
 * window, menu or palette once its exit finishes; this makes sure it does.
 */
function guaranteeEnd(node: Element, afterMs: number): void {
  setTimeout(() => {
    for (const animation of transitionAnimations(node)) {
      if (animation.playState !== "finished") animation.finish();
    }
  }, afterMs);
}

/**
 * A Svelte transition from a motion description: duration from a token,
 * nothing under reduced motion, and a guaranteed end (see guaranteeEnd).
 * Use as `in:` / `out:` through a small wrapper that builds the Motion.
 */
export function motion(node: Element, spec: Motion | null): TransitionConfig {
  if (!spec || prefersReducedMotion()) return { duration: 0 };
  const duration = durationMs(...spec.duration);
  guaranteeEnd(node, duration + MOTION_GRACE_MS);
  return { duration, easing: spec.easing ?? expoOut, css: spec.css };
}
