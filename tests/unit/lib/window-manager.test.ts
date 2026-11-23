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

  it("hands focus to the top-most visible window after minimise and close", () => {
    reset();
    windowManager.open({ id: "a", appId: "a", title: "A", x: 0, y: 0, w: 1, h: 1 });
    windowManager.open({ id: "b", appId: "b", title: "B", x: 0, y: 0, w: 1, h: 1 });
    windowManager.open({ id: "c", appId: "c", title: "C", x: 0, y: 0, w: 1, h: 1 });
    windowManager.minimize("c");
    expect(windowManager.get().activeId).toBe("b");
    windowManager.close("b");
    expect(windowManager.get().activeId).toBe("a");
    windowManager.close("a");
    expect(windowManager.get().activeId).toBeNull();
  });

  it("toggleFromTaskbar minimises the active window and restores others", () => {
    reset();
    windowManager.open({ id: "a", appId: "a", title: "A", x: 0, y: 0, w: 1, h: 1 });
    windowManager.open({ id: "b", appId: "b", title: "B", x: 0, y: 0, w: 1, h: 1 });

    windowManager.toggleFromTaskbar("b");
    let s = windowManager.get();
    expect(s.windows.find((w) => w.id === "b")!.minimized).toBe(true);
    expect(s.activeId).toBe("a");

    windowManager.toggleFromTaskbar("b");
    s = windowManager.get();
    expect(s.windows.find((w) => w.id === "b")!.minimized).toBe(false);
    expect(s.activeId).toBe("b");

    windowManager.toggleFromTaskbar("a");
    expect(windowManager.get().activeId).toBe("a");
  });

  it("re-opening a window restores and raises it instead of duplicating it", () => {
    reset();
    windowManager.open({ id: "a", appId: "a", title: "A", x: 0, y: 0, w: 1, h: 1 });
    windowManager.minimize("a");
    windowManager.open({ id: "a", appId: "a", title: "A", x: 9, y: 9, w: 1, h: 1 });
    const s = windowManager.get();
    expect(s.windows).toHaveLength(1);
    expect(s.windows[0]?.minimized).toBe(false);
    expect(s.windows[0]?.x).toBe(0);
    expect(s.activeId).toBe("a");
  });

  it("moves, resizes and toggles maximise", () => {
    reset();
    windowManager.open({ id: "a", appId: "a", title: "A", x: 0, y: 0, w: 1, h: 1 });
    windowManager.move("a", 40, 50);
    windowManager.resize("a", 300, 200);
    windowManager.toggleMax("a");
    expect(windowManager.get().windows[0]).toMatchObject({ x: 40, y: 50, w: 300, h: 200, maximized: true });
    windowManager.toggleMax("a");
    expect(windowManager.get().windows[0]?.maximized).toBe(false);
  });

  it("cascades every window into view and activates the last", () => {
    reset();
    windowManager.open({ id: "a", appId: "a", title: "A", x: 500, y: 500, w: 1, h: 1 });
    windowManager.open({ id: "b", appId: "b", title: "B", x: 500, y: 500, w: 1, h: 1 });
    windowManager.minimize("a");
    windowManager.toggleMax("b");
    windowManager.cascade();
    const [a, b] = windowManager.get().windows;
    expect(a).toMatchObject({ x: 32, y: 32, minimized: false });
    expect(b).toMatchObject({ x: 60, y: 60, maximized: false });
    expect(b!.z).toBeGreaterThan(a!.z);
    expect(windowManager.get().activeId).toBe("b");
  });

  it("ignores taskbar toggles for unknown windows and focus on the active top window", () => {
    reset();
    windowManager.open({ id: "a", appId: "a", title: "A", x: 0, y: 0, w: 1, h: 1 });
    const before = windowManager.get();
    windowManager.toggleFromTaskbar("missing");
    windowManager.focus("a");
    expect(windowManager.get()).toBe(before);
  });

  it("keeps the active window when another one closes", () => {
    reset();
    windowManager.open({ id: "a", appId: "a", title: "A", x: 0, y: 0, w: 1, h: 1 });
    windowManager.open({ id: "b", appId: "b", title: "B", x: 0, y: 0, w: 1, h: 1 });
    windowManager.close("a");
    windowManager.minimize("missing");
    expect(windowManager.get().activeId).toBe("b");
  });
});

describe("snapping", () => {
  const open = () => windowManager.open({ id: "w", appId: "w", title: "W", x: 100, y: 80, w: 400, h: 300 });

  it("snaps to a half, remembering the box from before the first snap", () => {
    windowManager.reset();
    open();
    windowManager.snap("w", "left", { x: 0, y: 0, w: 500, h: 700 });
    windowManager.snap("w", "right", { x: 500, y: 0, w: 500, h: 700 });
    const win = windowManager.get().windows[0]!;
    expect(win).toMatchObject({
      x: 500,
      w: 500,
      snapped: { zone: "right", restore: { x: 100, y: 80, w: 400, h: 300 } },
    });
  });

  it("unsnaps to the old box, or to a given spot", () => {
    windowManager.reset();
    open();
    expect(windowManager.unsnap("w")).toBe(false);
    windowManager.snap("w", "left", { x: 0, y: 0, w: 500, h: 700 });
    expect(windowManager.unsnap("w", { x: 250, y: 10 })).toBe(true);
    expect(windowManager.get().windows[0]).toMatchObject({ x: 250, y: 10, w: 400, h: 300, snapped: undefined });
  });

  it("cascading gives snapped windows their old size back", () => {
    windowManager.reset();
    open();
    windowManager.snap("w", "left", { x: 0, y: 0, w: 500, h: 700 });
    windowManager.cascade();
    expect(windowManager.get().windows[0]).toMatchObject({ w: 400, h: 300, snapped: undefined });
  });
});
