/**
 * The CRT degauss: when the theme flips, the picture wobbles and a ring of
 * colour fringing sweeps out from the centre, as an old monitor did when its
 * coil fired. Transform and opacity only, and nothing at all under reduced
 * motion.
 */
import { durationMs, prefersReducedMotion } from "./motion";

/** Damped wobble: each swing smaller than the last. */
const WOBBLE: Keyframe[] = [
  { transform: "none" },
  { transform: "scale(1.012, 0.988) skewX(0.6deg)", offset: 0.12 },
  { transform: "scale(0.992, 1.008) skewX(-0.5deg)", offset: 0.28 },
  { transform: "scale(1.006, 0.994) skewX(0.3deg)", offset: 0.46 },
  { transform: "scale(0.998, 1.002) skewX(-0.12deg)", offset: 0.66 },
  { transform: "none" },
];

// Easing per keyframe: on the whole animation an ease-out would rush the ring
// to its end before it was ever seen.
const RING: Keyframe[] = [
  { opacity: 0, transform: "scale(0.35)", easing: "cubic-bezier(0.2, 0.7, 0.2, 1)" },
  { opacity: 0.7, transform: "scale(0.85)", offset: 0.35, easing: "ease-in" },
  { opacity: 0, transform: "scale(1.5)" },
];

/** Marks the document while the effect runs, for styling and tests. */
export const DEGAUSS_ATTRIBUTE = "data-degaussing";

/**
 * Play the degauss on `screen` with the colour ring in `ring`. Returns a
 * promise that settles when it ends; resolves at once under reduced motion.
 */
export async function degauss(screen: HTMLElement, ring: HTMLElement): Promise<void> {
  if (prefersReducedMotion() || typeof screen.animate !== "function") return;
  const duration = durationMs("--dur-degauss", 650);
  const root = document.documentElement;
  root.setAttribute(DEGAUSS_ATTRIBUTE, "");
  const animations = [
    screen.animate(WOBBLE, { duration, easing: "linear" }),
    ring.animate(RING, { duration, easing: "linear" }),
  ];
  try {
    await Promise.all(animations.map((a) => a.finished));
  } catch {
    // Cancelled by a newer degauss; that one owns the attribute now.
    return;
  }
  root.removeAttribute(DEGAUSS_ATTRIBUTE);
}
