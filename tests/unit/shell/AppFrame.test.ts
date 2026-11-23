import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CrashHarness from "./fixtures/CrashHarness.svelte";

describe("AppFrame", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the app while it works", () => {
    render(CrashHarness, { failing: () => false, onClose: vi.fn() });
    expect(screen.getByText("app is running")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("swaps a crashing app for its blue screen and leaves the rest alone", () => {
    render(CrashHarness, { failing: () => true, onClose: vi.fn() });
    const crash = screen.getByRole("alert");
    expect(crash).toHaveTextContent("Thrower");
    expect(crash).toHaveTextContent("TypeError");
    expect(screen.getByText("the desktop is still here")).toBeInTheDocument();
    expect(console.error).toHaveBeenCalledWith('App "thrower" crashed', expect.any(TypeError));
  });

  it("restarts the app and closes the window from the blue screen", async () => {
    const user = userEvent.setup();
    let failing = true;
    const onClose = vi.fn();
    render(CrashHarness, { failing: () => failing, onClose });

    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);

    failing = false;
    await user.click(screen.getByRole("button", { name: "Restart app" }));
    expect(await screen.findByText("app is running")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("puts keyboard focus on Restart", () => {
    render(CrashHarness, { failing: () => true, onClose: vi.fn() });
    expect(screen.getByRole("button", { name: "Restart app" })).toHaveFocus();
  });
});
