import { describe, expect, it } from "vitest";
import {
  applySettingsToRoot,
  DEFAULT_SETTINGS,
  parseSettings,
  screensaverDelayMs,
  SETTINGS_BOOTSTRAP_SCRIPT,
  SETTINGS_STORAGE_KEY,
} from "@lib/settings";
import type { Settings } from "@lib/settings";

describe("settings contract", () => {
  it("returns defaults for missing and malformed storage", () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings("{")).toEqual(DEFAULT_SETTINGS);
  });

  it("keeps valid fields while dropping invalid and unknown fields", () => {
    expect(parseSettings('{"theme":"dark","crt":"neon","bootAnimation":"false","gridSpeed":"slow","extra":1}')).toEqual(
      {
        ...DEFAULT_SETTINGS,
        theme: "dark",
        gridSpeed: "slow",
      },
    );
  });

  it("returns defaults for wrong top-level JSON types", () => {
    expect(parseSettings("[]")).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings("null")).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings("42")).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('"x"')).toEqual(DEFAULT_SETTINGS);
  });

  it("always returns exactly six keys", () => {
    const parsed = parseSettings('{"theme":"dark","extra":"drop-me"}');
    expect(Object.keys(parsed).sort()).toEqual([
      "bootAnimation",
      "crt",
      "gridSpeed",
      "iconSize",
      "screensaver",
      "theme",
    ]);
  });

  it("parses the screensaver delay and converts it to milliseconds", () => {
    expect(parseSettings('{"screensaver":"10"}').screensaver).toBe("10");
    expect(parseSettings('{"screensaver":"5"}').screensaver).toBe(DEFAULT_SETTINGS.screensaver);
    expect(screensaverDelayMs("1")).toBe(60_000);
    expect(screensaverDelayMs("never")).toBeNull();
  });

  it("applySettingsToRoot sets exactly the four mapped attributes", () => {
    const root = document.createElement("div");
    const value: Settings = {
      bootAnimation: false,
      theme: "dark",
      crt: "subtle",
      gridSpeed: "fast",
      iconSize: "large",
      screensaver: "3",
    };

    applySettingsToRoot(root, value);

    const names = root.getAttributeNames().sort();
    expect(names).toEqual(["data-crt", "data-grid-speed", "data-icon-size", "data-theme"]);
    expect(root.getAttribute("data-theme")).toBe("dark");
    expect(root.getAttribute("data-crt")).toBe("subtle");
    expect(root.getAttribute("data-grid-speed")).toBe("fast");
    expect(root.getAttribute("data-icon-size")).toBe("large");
  });

  it("bootstrap script applies whitelisted root attributes from valid storage", () => {
    localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({ theme: "dark", crt: "subtle", gridSpeed: "fast", iconSize: "large" }),
    );

    expect(() => new Function(SETTINGS_BOOTSTRAP_SCRIPT)()).not.toThrow();

    const root = document.documentElement;
    expect(root.getAttribute("data-theme")).toBe("dark");
    expect(root.getAttribute("data-crt")).toBe("subtle");
    expect(root.getAttribute("data-grid-speed")).toBe("fast");
    expect(root.getAttribute("data-icon-size")).toBe("large");
  });

  it("bootstrap script ignores malformed JSON without throwing", () => {
    const root = document.documentElement;
    root.setAttribute("data-theme", "light");
    root.setAttribute("data-crt", "full");
    root.setAttribute("data-grid-speed", "normal");
    root.setAttribute("data-icon-size", "medium");

    localStorage.setItem(SETTINGS_STORAGE_KEY, "{");

    expect(() => new Function(SETTINGS_BOOTSTRAP_SCRIPT)()).not.toThrow();

    expect(root.getAttribute("data-theme")).toBe("light");
    expect(root.getAttribute("data-crt")).toBe("full");
    expect(root.getAttribute("data-grid-speed")).toBe("normal");
    expect(root.getAttribute("data-icon-size")).toBe("medium");
  });

  it("bootstrap script ignores unlisted values", () => {
    const root = document.documentElement;
    root.setAttribute("data-theme", "light");

    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ theme: 'dark" onload="x' }));

    expect(() => new Function(SETTINGS_BOOTSTRAP_SCRIPT)()).not.toThrow();
    expect(root.getAttribute("data-theme")).toBe("light");
  });

  it("bootstrap script contains no literal less-than characters", () => {
    expect(SETTINGS_BOOTSTRAP_SCRIPT.includes("<")).toBe(false);
  });
});
