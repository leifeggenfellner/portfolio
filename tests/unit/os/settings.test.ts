import { afterEach, describe, expect, it, vi } from "vitest";
import { SettingsService } from "@lib/os/settings.svelte";
import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY } from "@lib/settings";

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("SettingsService", () => {
  it("hydrates from storage, persists changes and clears them on reset", () => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ theme: "dark", crt: "neon" }));
    const settings = new SettingsService();
    expect(settings.current).toEqual(DEFAULT_SETTINGS);

    settings.hydrate();
    expect(settings.current).toEqual({ ...DEFAULT_SETTINGS, theme: "dark" });

    settings.set("gridSpeed", "fast");
    expect(JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) ?? "")).toMatchObject({
      theme: "dark",
      gridSpeed: "fast",
    });

    settings.reset();
    expect(settings.current).toEqual(DEFAULT_SETTINGS);
    expect(localStorage.getItem(SETTINGS_STORAGE_KEY)).toBeNull();
  });

  it("keeps working for the visit when storage throws", () => {
    for (const method of ["getItem", "setItem", "removeItem"] as const) {
      vi.spyOn(Storage.prototype, method).mockImplementation(() => {
        throw new DOMException("blocked", "SecurityError");
      });
    }
    const settings = new SettingsService();
    expect(() => settings.hydrate()).not.toThrow();
    settings.set("theme", "dark");
    expect(settings.current.theme).toBe("dark");
    expect(() => settings.reset()).not.toThrow();
    expect(settings.current).toEqual(DEFAULT_SETTINGS);
  });
});
