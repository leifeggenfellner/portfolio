import { fireEvent, render, screen } from "@testing-library/svelte";
import { createRawSnippet } from "svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import RetroWindow from "@primitives/RetroWindow.svelte";

const body = createRawSnippet(() => ({ render: () => "<p>window body</p>" }));

// Reduced motion keeps Svelte's transitions instant; happy-dom has no Web Animations.
beforeEach(() => {
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) => ({ matches: query.includes("reduce"), media: query }) as MediaQueryList,
  );
});
afterEach(() => vi.restoreAllMocks());

function setup(props: Record<string, unknown> = {}) {
  const handlers = {
    onFocus: vi.fn(),
    onMove: vi.fn(),
    onResize: vi.fn(),
    onClose: vi.fn(),
    onMin: vi.fn(),
    onMax: vi.fn(),
  };
  render(RetroWindow, {
    props: { id: "w1", title: "Notes", children: body, x: 100, y: 80, w: 300, h: 200, ...handlers, ...props },
  });
  return { ...handlers, win: screen.getByRole("dialog", { name: "Notes" }) };
}

describe("RetroWindow", () => {
  it("closes on Escape unless something else handled it", async () => {
    const { win, onClose } = setup();
    await fireEvent.keyDown(win, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
    const handled = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
    handled.preventDefault();
    win.dispatchEvent(handled);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("drags by the title bar, never above the top edge", async () => {
    const { onMove, onFocus } = setup();
    await fireEvent.pointerDown(screen.getByText("Notes"), { clientX: 10, clientY: 10 });
    expect(onFocus).toHaveBeenCalled();
    await fireEvent.pointerMove(window, { clientX: 60, clientY: 40 });
    expect(onMove).toHaveBeenLastCalledWith(150, 110);
    await fireEvent.pointerMove(window, { clientX: 60, clientY: -500 });
    expect(onMove).toHaveBeenLastCalledWith(150, 0);
    await fireEvent.pointerUp(window);
    await fireEvent.pointerMove(window, { clientX: 0, clientY: 0 });
    expect(onMove).toHaveBeenCalledTimes(2);
  });

  it("does not drag while maximised and fills the screen", async () => {
    const { win, onMove } = setup({ maximized: true });
    expect(win.style.width).toBe("100%");
    await fireEvent.pointerDown(screen.getByText("Notes"), { clientX: 10, clientY: 10 });
    await fireEvent.pointerMove(window, { clientX: 60, clientY: 40 });
    expect(onMove).not.toHaveBeenCalled();
  });

  it("resizes from the corner grip with a minimum size", async () => {
    const { onResize } = setup();
    await fireEvent.pointerDown(screen.getByRole("button", { name: "Resize window" }), { clientX: 0, clientY: 0 });
    await fireEvent.pointerMove(window, { clientX: 400, clientY: 300 });
    // happy-dom lays nothing out, so the start size is 0 and the minimums apply first.
    expect(onResize).toHaveBeenLastCalledWith(400, 300);
    await fireEvent.pointerMove(window, { clientX: 10, clientY: 10 });
    expect(onResize).toHaveBeenLastCalledWith(260, 160);
    await fireEvent.pointerUp(window);
  });
});
