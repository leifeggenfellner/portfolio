/**
 * What the command palette can do, as plain data: launch an app (with
 * arguments, e.g. a project or a terminal command) or change a setting.
 * Everything listed comes from the app manifests and the settings schema;
 * the shell turns a chosen item into the action, this module only lists
 * and ranks them.
 */
import { fuzzyRank } from "./fuzzy";
import { SETTINGS_SCHEMA } from "./settings";
import type { AppArgs, AppCommand } from "./app-shell";
import type { SettingKey, SettingSpec } from "./settings";

export interface SettingChange {
  key: SettingKey;
  value: string;
}

export type PaletteAction = { kind: "launch"; appId: string; args?: AppArgs } | ({ kind: "setting" } & SettingChange);

export interface PaletteItem {
  id: string;
  label: string;
  /** "Apps", "Projects", "Settings", or the app a command belongs to. */
  group: string;
  action: PaletteAction;
}

export interface PaletteApp {
  id: string;
  title: string;
  commands?: readonly AppCommand[];
}

const capitalise = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export function paletteItems(
  apps: readonly PaletteApp[],
  projects: readonly { slug: string; name: string }[],
): PaletteItem[] {
  return [
    ...apps.map((app) => launch(`app:${app.id}`, app.title, "Apps", app.id)),
    ...projects.map((p) => launch(`project:${p.slug}`, p.name, "Projects", "projects", { project: p.slug })),
    ...settingItems(),
    ...apps.flatMap((app) =>
      (app.commands ?? []).map((command) =>
        launch(`${app.id}:${command.label}`, command.label, app.title, app.id, command.args),
      ),
    ),
  ];
}

function launch(id: string, label: string, group: string, appId: string, args?: AppArgs): PaletteItem {
  return { id, label, group, action: { kind: "launch", appId, ...(args ? { args } : {}) } };
}

/** Every value of every setting marked for the palette, e.g. "Theme: Dark". */
function settingItems(): PaletteItem[] {
  return (Object.entries(SETTINGS_SCHEMA) as [SettingKey, SettingSpec][]).flatMap(([key, spec]) =>
    spec.kind === "choice" && spec.palette
      ? spec.options.map(([value]) => ({
          id: `setting:${key}:${value}`,
          label: `${spec.palette}: ${capitalise(value)}`,
          group: "Settings",
          action: { kind: "setting" as const, key, value },
        }))
      : [],
  );
}

/** Items matching `query`, best first. The group name counts, so "settings" lists them all. */
export function searchPalette(items: readonly PaletteItem[], query: string): PaletteItem[] {
  return fuzzyRank(items, query, (item) => `${item.label} ${item.group}`);
}
