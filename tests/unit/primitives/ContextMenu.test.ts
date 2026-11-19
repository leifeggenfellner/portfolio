import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";
import ContextMenu from "@primitives/ContextMenu.svelte";

// Untyped: tsc reads .svelte modules through a shim without their named type exports.
const ITEMS = [
  { id: "open", label: "Open" },
  { separator: true as const },
  { id: "off", label: "Unavailable", disabled: true },
  { id: "theme", label: "Dark Theme" },
];

function setup() {
  const onSelect = vi.fn();
  const onClose = vi.fn();
  render(ContextMenu, { props: { items: ITEMS, x: 10, y: 10, onSelect, onClose } });
  return { onSelect, onClose, menu: screen.getByRole("menu") };
}

describe("ContextMenu", () => {
  it("renders items and separators, and takes focus", () => {
    const { menu } = setup();
    expect(screen.getAllByRole("menuitem")).toHaveLength(3);
    expect(screen.getByRole("separator")).toBeInTheDocument();
    expect(menu).toHaveFocus();
    expect(screen.getByRole("menuitem", { name: "Unavailable" })).toHaveAttribute("aria-disabled", "true");
  });

  it("moves with the arrow keys, wraps, and selects with Enter", async () => {
    const { menu, onSelect, onClose } = setup();
    await fireEvent.keyDown(menu, { key: "ArrowUp" });
    expect(screen.getByRole("menuitem", { name: "Dark Theme" })).toHaveFocus();
    await fireEvent.keyDown(menu, { key: "ArrowDown" });
    expect(screen.getByRole("menuitem", { name: "Open" })).toHaveFocus();
    await fireEvent.keyDown(menu, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledWith("open");
    expect(onClose).toHaveBeenCalled();
  });

  it("won't select a disabled item", async () => {
    const { menu, onSelect } = setup();
    await fireEvent.keyDown(menu, { key: "ArrowDown" });
    await fireEvent.keyDown(menu, { key: "ArrowDown" });
    await fireEvent.keyDown(menu, { key: " " });
    screen.getByRole("menuitem", { name: "Unavailable" }).click();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("selects on click and closes on Escape, Tab or an outside click", async () => {
    const { menu, onSelect, onClose } = setup();
    screen.getByRole("menuitem", { name: "Dark Theme" }).click();
    expect(onSelect).toHaveBeenCalledWith("theme");
    await fireEvent.keyDown(menu, { key: "Escape" });
    await fireEvent.keyDown(menu, { key: "Tab" });
    await new Promise((resolve) => setTimeout(resolve, 0));
    await fireEvent.mouseDown(document.body);
    expect(onClose).toHaveBeenCalledTimes(4);
  });
});
