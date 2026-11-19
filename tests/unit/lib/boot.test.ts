import { afterEach, describe, expect, it, vi } from "vitest";
import { hasVisited, markVisited, VISITED_STORAGE_KEY } from "@lib/boot";

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("boot visit tracking", () => {
  it("treats the first visit as unvisited, then remembers it", () => {
    expect(hasVisited()).toBe(false);
    markVisited();
    expect(localStorage.getItem(VISITED_STORAGE_KEY)).toBe("true");
    expect(hasVisited()).toBe(true);
  });

  it("falls back to a first visit when storage is blocked", () => {
    vi.spyOn(localStorage, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(localStorage, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => markVisited()).not.toThrow();
    expect(hasVisited()).toBe(false);
  });
});
