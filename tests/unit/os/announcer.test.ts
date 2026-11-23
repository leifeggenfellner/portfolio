import { afterEach, expect, it, vi } from "vitest";
import { ANNOUNCE_DEBOUNCE_MS, Announcer } from "@lib/os/announcer.svelte";

afterEach(() => vi.useRealTimers());

it("says only the last of a burst, and says repeated text again", () => {
  vi.useFakeTimers();
  const announcer = new Announcer();
  announcer.announce("Terminal opened");
  announcer.announce("Terminal snapped to the left half");
  vi.advanceTimersByTime(ANNOUNCE_DEBOUNCE_MS);
  expect(announcer.message).toBe("Terminal snapped to the left half");

  // The same text twice: the region empties first, so it is read again.
  announcer.announce("Terminal snapped to the left half");
  expect(announcer.message).toBe("");
  vi.advanceTimersByTime(ANNOUNCE_DEBOUNCE_MS);
  expect(announcer.message).toBe("Terminal snapped to the left half");
});
