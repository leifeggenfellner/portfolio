import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VISITED_STORAGE_KEY } from "@lib/boot";
import { Boot } from "@lib/os/boot.svelte";

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  localStorage.clear();
});

describe("Boot", () => {
  it("plays the BIOS on a first visit and the short splash after", () => {
    const first = new Boot();
    first.start(true);
    expect(first.phase).toBe("bios");
    first.biosDone();
    first.leaveSplash(240);
    vi.advanceTimersByTime(240);
    expect(first.phase).toBe("desktop");
    expect(localStorage.getItem(VISITED_STORAGE_KEY)).toBe("true");

    const returning = new Boot();
    returning.start(true);
    expect(returning).toMatchObject({ phase: "splash", returning: true });
  });

  it("removes the splash on a timer even if its fade never finishes", () => {
    const boot = new Boot();
    boot.start(true);
    boot.biosDone();
    boot.leaveSplash(240);
    expect(boot.phase).toBe("leaving");
    vi.advanceTimersByTime(239);
    expect(boot.phase).toBe("leaving");
    vi.advanceTimersByTime(1);
    expect(boot.phase).toBe("desktop");
  });

  it("skips to the desktop from any phase, and goes straight there with the animation off", () => {
    const boot = new Boot();
    boot.start(true);
    boot.finish();
    expect(boot.running).toBe(false);
    boot.leaveSplash(240);
    expect(boot.phase).toBe("desktop");

    const off = new Boot();
    off.start(false);
    expect(off.phase).toBe("desktop");
  });
});
