import { afterEach, describe, expect, it, vi } from "vitest";
import { APP_VERSION, BUILD_DATE } from "@lib/build-info";
import { degauss, DEGAUSS_ATTRIBUTE } from "@lib/degauss";
import { durationMs, easing, prefersReducedMotion } from "@lib/motion";

function mockReducedMotion(reduce: boolean) {
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) => ({ matches: reduce && query.includes("reduce"), media: query }) as MediaQueryList,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  document.documentElement.removeAttribute("style");
  document.documentElement.removeAttribute(DEGAUSS_ATTRIBUTE);
});

describe("motion tokens", () => {
  it("reads the reduced-motion preference", () => {
    mockReducedMotion(true);
    expect(prefersReducedMotion()).toBe(true);
    mockReducedMotion(false);
    expect(prefersReducedMotion()).toBe(false);
  });

  it("parses duration tokens in ms or s, with a fallback", () => {
    const root = document.documentElement;
    root.style.setProperty("--dur-a", "240ms");
    root.style.setProperty("--dur-b", "0.5s");
    expect(durationMs("--dur-a", 1)).toBe(240);
    expect(durationMs("--dur-b", 1)).toBe(500);
    expect(durationMs("--dur-missing", 99)).toBe(99);
  });

  it("reads easing tokens, with a fallback", () => {
    document.documentElement.style.setProperty("--ease-a", "cubic-bezier(0, 0, 1, 1)");
    expect(easing("--ease-a")).toBe("cubic-bezier(0, 0, 1, 1)");
    expect(easing("--ease-missing")).toBe("ease-out");
  });
});

describe("degauss", () => {
  function fakeAnimatable() {
    let finish!: () => void;
    const finished = new Promise<void>((resolve) => (finish = resolve));
    const el = document.createElement("div");
    // happy-dom has no Web Animations; a stand-in Animation only needs `finished`.
    const animate = vi.fn(() => ({ finished }) as unknown as Animation);
    el.animate = animate;
    return { el, animate, finish: () => finish() };
  }

  it("does nothing under reduced motion", async () => {
    mockReducedMotion(true);
    const screen = fakeAnimatable();
    await degauss(screen.el, fakeAnimatable().el);
    expect(screen.animate).not.toHaveBeenCalled();
  });

  it("animates the screen and ring, marking the document while it runs", async () => {
    mockReducedMotion(false);
    const screen = fakeAnimatable();
    const ring = fakeAnimatable();
    const running = degauss(screen.el, ring.el);
    expect(document.documentElement.hasAttribute(DEGAUSS_ATTRIBUTE)).toBe(true);
    expect(screen.animate).toHaveBeenCalledTimes(1);
    expect(ring.animate).toHaveBeenCalledTimes(1);
    screen.finish();
    ring.finish();
    await running;
    expect(document.documentElement.hasAttribute(DEGAUSS_ATTRIBUTE)).toBe(false);
  });

  it("leaves the attribute to the newer run when cancelled", async () => {
    mockReducedMotion(false);
    const el = document.createElement("div");
    // A stand-in Animation: degauss only awaits `finished`.
    el.animate = vi.fn(() => ({ finished: Promise.reject(new Error("cancelled")) }) as unknown as Animation);
    await degauss(el, el);
    expect(document.documentElement.hasAttribute(DEGAUSS_ATTRIBUTE)).toBe(true);
  });
});

describe("build info", () => {
  it("falls back to placeholders outside an Astro build", () => {
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    expect(BUILD_DATE).toMatch(/^\d{4}\.\d{2}\.\d{2}$/);
  });
});
