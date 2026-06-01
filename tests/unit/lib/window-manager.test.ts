import { describe, it, expect } from "vitest";
import { windowManager } from "@lib/store/window-manager";

const reset = () => windowManager.reset({ windows: [], activeId: null, zCursor: 100 });

describe("window-manager store", () => {
  it("opens a window and focuses it", () => {
    reset();
    windowManager.open({ id: "about", appId: "about", title: "About", x: 0, y: 0, w: 400, h: 300 });
    const s = windowManager.get();
    expect(s.windows).toHaveLength(1);
    expect(s.activeId).toBe("about");
    expect(s.windows[0]!.z).toBeGreaterThan(100);
  });

  it("bumps z-index on focus", () => {
    reset();
    windowManager.open({ id: "a", appId: "a", title: "A", x: 0, y: 0, w: 1, h: 1 });
    windowManager.open({ id: "b", appId: "b", title: "B", x: 0, y: 0, w: 1, h: 1 });
    windowManager.focus("a");
    const s = windowManager.get();
    const a = s.windows.find((w) => w.id === "a")!;
    const b = s.windows.find((w) => w.id === "b")!;
    expect(a.z).toBeGreaterThan(b.z);
    expect(s.activeId).toBe("a");
  });

  it("minimize hides without unmounting", () => {
    reset();
    windowManager.open({ id: "a", appId: "a", title: "A", x: 0, y: 0, w: 1, h: 1 });
    windowManager.minimize("a");
    expect(windowManager.get().windows[0]!.minimized).toBe(true);
  });
});
