import { describe, it, expect } from "vitest";
import { useWindowManager } from "@lib/store/window-manager";

const reset = () => useWindowManager.setState({ windows: [], activeId: null, zCursor: 100 });

describe("window-manager store", () => {
  it("opens a window and focuses it", () => {
    reset();
    const { open } = useWindowManager.getState();
    open({ id: "about", appId: "about", title: "About", x: 0, y: 0, w: 400, h: 300 });
    const s = useWindowManager.getState();
    expect(s.windows).toHaveLength(1);
    expect(s.activeId).toBe("about");
    expect(s.windows[0]!.z).toBeGreaterThan(100);
  });

  it("bumps z-index on focus", () => {
    reset();
    const { open, focus } = useWindowManager.getState();
    open({ id: "a", appId: "a", title: "A", x: 0, y: 0, w: 1, h: 1 });
    open({ id: "b", appId: "b", title: "B", x: 0, y: 0, w: 1, h: 1 });
    focus("a");
    const s = useWindowManager.getState();
    const a = s.windows.find((w) => w.id === "a")!;
    const b = s.windows.find((w) => w.id === "b")!;
    expect(a.z).toBeGreaterThan(b.z);
    expect(s.activeId).toBe("a");
  });

  it("minimize hides without unmounting", () => {
    reset();
    const { open, minimize } = useWindowManager.getState();
    open({ id: "a", appId: "a", title: "A", x: 0, y: 0, w: 1, h: 1 });
    minimize("a");
    expect(useWindowManager.getState().windows[0]!.minimized).toBe(true);
  });
});
