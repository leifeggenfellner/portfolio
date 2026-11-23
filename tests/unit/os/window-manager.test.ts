import { describe, expect, it } from "vitest";
import { WINDOW_Z_BASE, WindowManager } from "@lib/os/window-manager.svelte";

const AREA = { width: 1000, height: 700 };

function withWindows(...ids: string[]) {
  const wm = new WindowManager();
  for (const id of ids) wm.open({ id, appId: id, title: id, box: { x: 100, y: 80, w: 400, h: 300 } });
  return wm;
}

describe("stacking and focus", () => {
  it("activates the newest window and hands focus down the stack on minimise and close", () => {
    const wm = withWindows("a", "b", "c");
    expect(wm.activeId).toBe("c");
    wm.minimize("c");
    expect(wm.activeId).toBe("b");
    wm.focus("a");
    wm.close("a");
    expect(wm.activeId).toBe("b");
    wm.close("b");
    expect(wm.activeId).toBeNull();
  });

  it("derives a bounded z-index from the stack, however often windows are focused", () => {
    const wm = withWindows("a", "b");
    for (let i = 0; i < 10_000; i++) wm.focus(i % 2 ? "a" : "b");
    expect(wm.z("a")).toBe(WINDOW_Z_BASE + 1);
    expect(wm.z("b")).toBe(WINDOW_Z_BASE);
    expect(wm.topZ).toBe(WINDOW_Z_BASE + 1);
  });

  it("keeps the taskbar order when the stack changes", () => {
    const wm = withWindows("a", "b");
    wm.focus("a");
    expect(wm.windows.map((w) => w.id)).toEqual(["a", "b"]);
  });

  it("toggles from the taskbar: minimises the active window, otherwise brings it forward", () => {
    const wm = withWindows("a", "b");
    wm.toggleFromTaskbar("b");
    expect(wm.get("b")?.minimized).toBe(true);
    expect(wm.activeId).toBe("a");
    wm.toggleFromTaskbar("b");
    expect(wm.activeId).toBe("b");
    wm.toggleFromTaskbar("missing");
    expect(wm.activeId).toBe("b");
  });

  it("brings an open window forward on reopen, handing it the new arguments, without duplicating or moving it", () => {
    const wm = withWindows("a", "b");
    wm.minimize("a");
    const args = { project: "retro-os" };
    wm.open({ id: "a", appId: "a", title: "a", box: { x: 9, y: 9, w: 1, h: 1 }, args });
    expect(wm.windows).toHaveLength(2);
    expect(wm.get("a")).toMatchObject({ minimized: false, box: { x: 100 } });
    expect(wm.get("a")?.args).toBe(args);
    expect(wm.activeId).toBe("a");
  });
});

describe("layout", () => {
  const FLOATING = { x: 100, y: 80, w: 400, h: 300 };

  it("snaps to a half and back to the box from before the first snap", () => {
    const wm = withWindows("w");
    wm.snap("w", "left", AREA);
    wm.snap("w", "right", AREA);
    expect(wm.get("w")).toMatchObject({ snapped: "right", box: { x: 500, y: 0, w: 500, h: 700 } });
    expect(wm.restore("w")).toBe(true);
    expect(wm.get("w")).toMatchObject({ snapped: null, box: FLOATING });
    expect(wm.restore("w")).toBe(false);
  });

  it("unsnaps a dragged window at the pointer, keeping its old size", () => {
    const wm = withWindows("w");
    wm.snap("w", "left", AREA);
    wm.restore("w", { x: 250, y: 10 });
    expect(wm.get("w")?.box).toEqual({ x: 250, y: 10, w: 400, h: 300 });
  });

  it("steps down from maximised to the snap it came from, then to floating", () => {
    const wm = withWindows("w");
    wm.snap("w", "left", AREA);
    wm.snapKey("w", "up", AREA);
    expect(wm.get("w")?.maximized).toBe(true);
    wm.snapKey("w", "down", AREA);
    expect(wm.get("w")).toMatchObject({ maximized: false, snapped: "left" });
    wm.snapKey("w", "down", AREA);
    expect(wm.get("w")).toMatchObject({ snapped: null, box: FLOATING });
  });

  it("snaps straight out of maximised, still remembering the floating box", () => {
    const wm = withWindows("w");
    wm.toggleMax("w");
    wm.snapKey("w", "right", AREA);
    expect(wm.get("w")).toMatchObject({ maximized: false, snapped: "right" });
    wm.restore("w");
    expect(wm.get("w")?.box).toEqual(FLOATING);
  });

  it("cascades every window floating, restored and on screen, the last on top", () => {
    const wm = withWindows("a", "b");
    wm.snap("a", "left", AREA);
    wm.minimize("a");
    wm.toggleMax("b");
    wm.focus("a");
    wm.cascade();
    expect(wm.get("a")).toMatchObject({ minimized: false, snapped: null, box: { x: 32, y: 32, w: 400, h: 300 } });
    expect(wm.get("b")).toMatchObject({ maximized: false, box: { x: 60, y: 60 } });
    expect(wm.activeId).toBe("b");
  });
});
