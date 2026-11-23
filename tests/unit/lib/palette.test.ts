import { describe, expect, it } from "vitest";
import { paletteItems, searchPalette } from "@lib/palette";

const apps = [
  { id: "terminal", title: "Terminal", commands: [{ label: "neofetch", args: { command: "neofetch" } }] },
  { id: "minigame", title: "Minesweeper" },
];
const items = paletteItems(apps, [{ slug: "retro-os", name: "Retro" }]);

describe("paletteItems", () => {
  it("turns apps, projects and app commands into launches, and palette settings into changes", () => {
    const groups = (group: string) => items.filter((item) => item.group === group);
    expect(groups("Apps").map((i) => i.label)).toEqual(["Terminal", "Minesweeper"]);
    expect(groups("Projects")[0]?.action).toEqual({ kind: "launch", appId: "projects", args: { project: "retro-os" } });
    expect(groups("Terminal")[0]?.action).toEqual({ kind: "launch", appId: "terminal", args: { command: "neofetch" } });
    expect(groups("Settings").map((i) => i.label)).toEqual(
      expect.arrayContaining(["Theme: Dark", "Grid speed: Paused"]),
    );
    expect(new Set(items.map((i) => i.id)).size).toBe(items.length);
  });
});

describe("searchPalette", () => {
  it("finds apps by fuzzy title", () => {
    expect(searchPalette(items, "mines")[0]?.action).toEqual({ kind: "launch", appId: "minigame" });
  });

  it("matches the group name, so a group word lists the group", () => {
    const settings = searchPalette(items, "settings");
    expect(settings.length).toBeGreaterThan(0);
    expect(settings.every((i) => i.group === "Settings")).toBe(true);
  });

  it("finds setting values", () => {
    expect(searchPalette(items, "theme dark")[0]?.action).toEqual({ kind: "setting", key: "theme", value: "dark" });
  });
});
