import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";
import WindowHeader from "@primitives/WindowHeader.svelte";

describe("WindowHeader", () => {
  it("shows the title and fires each window control", () => {
    const onMin = vi.fn();
    const onMax = vi.fn();
    const onClose = vi.fn();
    render(WindowHeader, { props: { title: "Terminal", onMin, onMax, onClose } });
    expect(screen.getByText("Terminal")).toBeInTheDocument();
    screen.getByRole("button", { name: "Minimize" }).click();
    screen.getByRole("button", { name: "Maximize" }).click();
    screen.getByRole("button", { name: "Close" }).click();
    expect(onMin).toHaveBeenCalledTimes(1);
    expect(onMax).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("offers Restore when maximised and toggles on double-click", async () => {
    const onMax = vi.fn();
    render(WindowHeader, { props: { title: "T", maximized: true, onMax } });
    expect(screen.getByRole("button", { name: "Restore" })).toBeInTheDocument();
    await fireEvent.dblClick(screen.getByRole("toolbar", { name: "Window header" }));
    expect(onMax).toHaveBeenCalledTimes(1);
  });

  it("leaves out controls without handlers and marks the inactive state", () => {
    render(WindowHeader, { props: { title: "T", active: false } });
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByRole("toolbar")).toHaveAttribute("data-active", "false");
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
