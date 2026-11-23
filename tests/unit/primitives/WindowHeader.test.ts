import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";
import WindowHeader from "@primitives/WindowHeader.svelte";

describe("WindowHeader", () => {
  it("offers Restore when maximised and toggles on double-click", async () => {
    const onMax = vi.fn();
    render(WindowHeader, { props: { title: "T", maximized: true, onMax } });
    expect(screen.getByRole("button", { name: "Restore" })).toBeInTheDocument();
    await fireEvent.dblClick(screen.getByRole("toolbar", { name: "Window header" }));
    expect(onMax).toHaveBeenCalledTimes(1);
  });

  it("starts a drag from the bar but not from the controls", async () => {
    const onPointerDown = vi.fn();
    render(WindowHeader, { props: { title: "T", onPointerDown, onClose: vi.fn() } });
    await fireEvent.pointerDown(screen.getByRole("button", { name: "Close" }));
    expect(onPointerDown).not.toHaveBeenCalled();
    await fireEvent.pointerDown(screen.getByText("T"));
    expect(onPointerDown).toHaveBeenCalledTimes(1);
  });
});
