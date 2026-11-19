import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import Settings from "@apps/Settings.svelte";
import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY } from "@lib/settings";
import { settings } from "@lib/store/settings";

describe("Settings app", () => {
  beforeEach(() => {
    localStorage.clear();
    settings.reset();
  });

  it("renders grouped native controls with accessible labels", () => {
    render(Settings);

    expect(screen.getByRole("group", { name: "Startup" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Appearance" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Desktop" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Play boot animation" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Dark" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Off" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Fast" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Large" })).toBeInTheDocument();
  });

  it("applies and persists control changes immediately", async () => {
    const user = userEvent.setup();
    render(Settings);

    await user.click(screen.getByRole("radio", { name: "Dark" }));

    expect(settings.get().theme).toBe("dark");
    expect(localStorage.getItem(SETTINGS_STORAGE_KEY)).toContain('"theme":"dark"');

    const boot = screen.getByRole("checkbox", { name: "Play boot animation" });
    boot.focus();
    expect(boot).toHaveFocus();
    await user.keyboard(" ");
    expect(settings.get().bootAnimation).toBe(false);
  });

  it("resets settings and removes persisted storage", async () => {
    const user = userEvent.setup();
    render(Settings);
    settings.set("theme", "dark");
    settings.set("gridSpeed", "fast");

    await user.click(screen.getByRole("button", { name: "Reset to defaults" }));

    expect(settings.get()).toEqual(DEFAULT_SETTINGS);
    expect(localStorage.getItem(SETTINGS_STORAGE_KEY)).toBeNull();
    expect(screen.getByRole("radio", { name: "Light" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Normal" })).toBeChecked();
  });
});
