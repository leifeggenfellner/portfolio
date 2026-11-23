import { afterEach, expect, it, vi } from "vitest";
import { MOTION_GRACE_MS, motion } from "@lib/motion";

afterEach(() => vi.useRealTimers());

// The bug this guards: with frames starved, a closed window's exit animation
// never finished, so Svelte never removed it.
it("finishes a transition whose animation stalls", () => {
  vi.useFakeTimers();
  const stalled = { playState: "running", finish: vi.fn() } as unknown as Animation; // a stub: only the two members motion() touches
  const node = { getAnimations: () => [stalled] } as unknown as Element; // a stub element, for the same reason
  const { duration = 0 } = motion(node, { duration: ["--dur-2", 160], css: () => "" });

  vi.advanceTimersByTime(duration + MOTION_GRACE_MS - 1);
  expect(stalled.finish).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1);
  expect(stalled.finish).toHaveBeenCalledOnce();
});
