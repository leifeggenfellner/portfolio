/**
 * What the command palette can do, as plain data: open an app, show a
 * project, change a setting or run a terminal command. The shell turns a
 * chosen item into the action; this module only lists and ranks them.
 */
import { fuzzyRank } from "./fuzzy";
import { CRT_MODES, GRID_SPEEDS, THEMES } from "./settings";
import type { CrtMode, GridSpeed, Theme } from "./settings";

export type SettingChange =
  | { key: "theme"; value: Theme }
  | { key: "crt"; value: CrtMode }
  | { key: "gridSpeed"; value: GridSpeed };

export type PaletteAction =
  | { kind: "app"; appId: string }
  | { kind: "project"; slug: string }
  | ({ kind: "setting" } & SettingChange)
  | { kind: "terminal"; command: string };

export type PaletteGroup = "Apps" | "Projects" | "Settings" | "Terminal";

export interface PaletteItem {
  id: string;
  label: string;
  group: PaletteGroup;
  action: PaletteAction;
}

/** Terminal commands worth a shortcut; each runs in the Terminal window. */
export const PALETTE_COMMANDS: readonly string[] = [
  "help",
  "neofetch",
  "whoami",
  "cat about.txt",
  "cat cv.txt",
  "ls projects",
  "fortune",
  "matrix",
  "pipes",
];

const capitalise = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export function paletteItems(
  apps: readonly { id: string; title: string }[],
  projects: readonly { slug: string; name: string }[],
): PaletteItem[] {
  return [
    ...apps.map((app) => ({
      id: `app:${app.id}`,
      label: app.title,
      group: "Apps" as const,
      action: { kind: "app" as const, appId: app.id },
    })),
    ...projects.map((project) => ({
      id: `project:${project.slug}`,
      label: project.name,
      group: "Projects" as const,
      action: { kind: "project" as const, slug: project.slug },
    })),
    ...THEMES.map((value) => setting("Theme", { key: "theme", value })),
    ...CRT_MODES.map((value) => setting("CRT", { key: "crt", value })),
    ...GRID_SPEEDS.map((value) => setting("Grid speed", { key: "gridSpeed", value })),
    ...PALETTE_COMMANDS.map((command) => ({
      id: `terminal:${command}`,
      label: command,
      group: "Terminal" as const,
      action: { kind: "terminal" as const, command },
    })),
  ];
}

function setting(name: string, change: SettingChange): PaletteItem {
  return {
    id: `setting:${change.key}:${change.value}`,
    label: `${name}: ${capitalise(change.value)}`,
    group: "Settings",
    action: { kind: "setting", ...change },
  };
}

/** Items matching `query`, best first. The group name counts, so "settings" lists them all. */
export function searchPalette(items: readonly PaletteItem[], query: string): PaletteItem[] {
  return fuzzyRank(items, query, (item) => `${item.label} ${item.group}`);
}
