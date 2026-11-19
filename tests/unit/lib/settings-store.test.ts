import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY } from "@lib/settings";
import { settings } from "@lib/store/settings";
import type { Settings } from "@lib/settings";

function setStoredValue(value: unknown): void {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(value));
}

describe("settings store", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    settings.reset();
  });

  function withoutLocalStorage(run: () => void): void {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
    Object.defineProperty(globalThis, "localStorage", {
      value: undefined,
      configurable: true,
      writable: true,
    });

    try {
      run();
    } finally {
      if (descriptor) {
        Object.defineProperty(globalThis, "localStorage", descriptor);
      }
    }
  }

  it("hydrate reads storage and updates in-memory state", () => {
    setStoredValue({ theme: "dark", iconSize: "large" });

    settings.hydrate();

    expect(settings.get()).toEqual({
      ...DEFAULT_SETTINGS,
      theme: "dark",
      iconSize: "large",
    });
  });

  it("hydrate is a no-op when localStorage is unavailable", () => {
    settings.set("theme", "dark");

    withoutLocalStorage(() => {
      expect(() => settings.hydrate()).not.toThrow();
    });

    expect(settings.get()).toEqual({
      ...DEFAULT_SETTINGS,
      theme: "dark",
    });
  });

  it("set updates in memory and persists the full settings object", () => {
    settings.set("theme", "dark");

    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    expect(stored).not.toBeNull();
    expect(stored && JSON.parse(stored)).toEqual({
      ...DEFAULT_SETTINGS,
      theme: "dark",
    });
    expect(settings.get()).toEqual({
      ...DEFAULT_SETTINGS,
      theme: "dark",
    });
  });

  it("reset restores defaults and removes persisted key", () => {
    settings.set("theme", "dark");

    settings.reset();

    expect(settings.get()).toEqual(DEFAULT_SETTINGS);
    expect(localStorage.getItem(SETTINGS_STORAGE_KEY)).toBeNull();
  });

  it("get returns current store value", () => {
    settings.set("crt", "off");

    expect(settings.get()).toEqual({
      ...DEFAULT_SETTINGS,
      crt: "off",
    });
  });

  it("notifies subscribers for hydrate, set, reset, and stops after unsubscribe", () => {
    const snapshots: Settings[] = [];
    const unsubscribe = settings.subscribe((value) => {
      snapshots.push(value);
    });

    expect(snapshots).toEqual([DEFAULT_SETTINGS]);

    setStoredValue({ theme: "dark" });
    settings.hydrate();
    expect(snapshots.at(-1)).toEqual({
      ...DEFAULT_SETTINGS,
      theme: "dark",
    });

    settings.set("crt", "off");
    expect(snapshots.at(-1)).toEqual({
      ...DEFAULT_SETTINGS,
      theme: "dark",
      crt: "off",
    });

    settings.reset();
    expect(snapshots.at(-1)).toEqual(DEFAULT_SETTINGS);

    const countAfterReset = snapshots.length;
    unsubscribe();
    settings.set("theme", "dark");

    expect(snapshots).toHaveLength(countAfterReset);
  });

  it("hydrate swallows getItem failures and keeps current value", () => {
    settings.set("theme", "dark");
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(() => settings.hydrate()).not.toThrow();
    expect(settings.get()).toEqual({
      ...DEFAULT_SETTINGS,
      theme: "dark",
    });
  });

  it("set swallows setItem failures and still updates in memory", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(() => settings.set("iconSize", "small")).not.toThrow();
    expect(settings.get()).toEqual({
      ...DEFAULT_SETTINGS,
      iconSize: "small",
    });
  });

  it("set updates in memory when localStorage is unavailable", () => {
    withoutLocalStorage(() => {
      expect(() => settings.set("theme", "dark")).not.toThrow();
    });

    expect(settings.get()).toEqual({
      ...DEFAULT_SETTINGS,
      theme: "dark",
    });
  });

  it("reset swallows removeItem failures and still updates in memory", () => {
    settings.set("theme", "dark");
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(() => settings.reset()).not.toThrow();
    expect(settings.get()).toEqual(DEFAULT_SETTINGS);
  });

  it("reset restores defaults when localStorage is unavailable", () => {
    settings.set("theme", "dark");

    withoutLocalStorage(() => {
      expect(() => settings.reset()).not.toThrow();
    });

    expect(settings.get()).toEqual(DEFAULT_SETTINGS);
  });

  it("treats a throwing localStorage getter as unavailable", () => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      get() {
        throw new Error("blocked");
      },
    });

    try {
      expect(() => settings.hydrate()).not.toThrow();
      expect(() => settings.set("theme", "dark")).not.toThrow();
      expect(settings.get()).toEqual({
        ...DEFAULT_SETTINGS,
        theme: "dark",
      });
      expect(() => settings.reset()).not.toThrow();
      expect(settings.get()).toEqual(DEFAULT_SETTINGS);
    } finally {
      if (descriptor) {
        Object.defineProperty(globalThis, "localStorage", descriptor);
      }
    }
  });
});
