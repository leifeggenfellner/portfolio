import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { RetroButton } from "@primitives/RetroButton";

describe("RetroButton", () => {
  it("renders children and is focusable", () => {
    render(<RetroButton>Launch</RetroButton>);
    const btn = screen.getByRole("button", { name: /launch/i });
    expect(btn).toBeInTheDocument();
    btn.focus();
    expect(btn).toHaveFocus();
  });

  it("fires onClick", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<RetroButton onClick={onClick}>Go</RetroButton>);
    await user.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("reflects active state via aria-pressed", () => {
    render(<RetroButton active>Toggle</RetroButton>);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });

  it("does not fire onClick when disabled", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <RetroButton disabled onClick={onClick}>
        Nope
      </RetroButton>,
    );
    await user.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });
});
