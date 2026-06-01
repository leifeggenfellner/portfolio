import { render, screen } from "@testing-library/svelte";
import { describe, it, expect, vi } from "vitest";
import RetroButton from "@primitives/RetroButton.svelte";

describe("RetroButton", () => {
  it("renders and is focusable", () => {
    render(RetroButton, { props: {} });
    const btn = screen.getByRole("button");
    expect(btn).toBeInTheDocument();
    btn.focus();
    expect(btn).toHaveFocus();
  });

  it("fires click", async () => {
    const onclick = vi.fn();
    render(RetroButton, { props: { onclick } });
    const btn = screen.getByRole("button");
    btn.click();
    expect(onclick).toHaveBeenCalledTimes(1);
  });

  it("reflects active state via aria-pressed", () => {
    render(RetroButton, { props: { active: true } });
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });

  it("does not fire click when disabled", () => {
    const onclick = vi.fn();
    render(RetroButton, { props: { disabled: true, onclick } });
    screen.getByRole("button").click();
    expect(onclick).not.toHaveBeenCalled();
  });
});
