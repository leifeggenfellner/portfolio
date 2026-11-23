import { describe, expect, it } from "vitest";
import { PALETTE_COMMANDS, paletteItems, searchPalette } from "@lib/palette";

const apps = [
  { id: "terminal", title: "Terminal" },
  { id: "minigame", title: "Minesweeper" },
];
const projects = [{ slug: "retro-os", name: "Retro" }];
const items = paletteItems(apps, projects);

describe("paletteItems", () => {
  it("lists apps, projects, every setting value and the terminal shortcuts", () => {
    const groups = (group: string) => items.filter((item) => item.group === group);
    expect(groups("Apps").map((i) => i.label)).toEqual(["Terminal", "Minesweeper"]);
    expect(groups("Projects")[0]?.action).toEqual({ kind: "project", slug: "retro-os" });
    expect(groups("Settings").map((i) => i.label)).toContain("Theme: Dark");
    expect(groups("Settings").map((i) => i.label)).toContain("Grid speed: Paused");
    expect(groups("Terminal")).toHaveLength(PALETTE_COMMANDS.length);
  });

  it("gives every item a unique id", () => {
    expect(new Set(items.map((i) => i.id)).size).toBe(items.length);
  });
});

describe("searchPalette", () => {
  it("finds apps by fuzzy title", () => {
    expect(searchPalette(items, "mines")[0]?.action).toEqual({ kind: "app", appId: "minigame" });
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
