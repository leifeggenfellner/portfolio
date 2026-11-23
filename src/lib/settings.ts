/**
 * Every user setting, described once. Parsing stored values, the defaults,
 * the attributes on <html>, the inline bootstrap script and the Settings
 * app's form are all derived from `SETTINGS_SCHEMA`.
 */

export type SettingsGroup = "Startup" | "Appearance" | "Desktop";

interface SpecBase {
  group: SettingsGroup;
  label: string;
}

export interface ToggleSpec extends SpecBase {
  kind: "toggle";
  default: boolean;
}

export interface ChoiceSpec<V extends string = string> extends SpecBase {
  kind: "choice";
  /** Values in display order, with their labels. */
  options: readonly (readonly [V, string])[];
  default: V;
  /** Mirrored onto <html> as this attribute, for CSS. */
  attribute?: `data-${string}`;
  /** Shown as one checkbox instead of radios: checked is the first value. */
  checkbox?: boolean;
  /** Offer every value in the command palette under this short name. */
  palette?: string;
}

export type SettingSpec = ToggleSpec | ChoiceSpec;

const toggle = (spec: Omit<ToggleSpec, "kind">): ToggleSpec => ({ kind: "toggle", ...spec });
const choice = <const V extends string>(spec: Omit<ChoiceSpec<V>, "kind">): ChoiceSpec<V> => ({
  kind: "choice",
  ...spec,
});

export const SETTINGS_SCHEMA = {
  bootAnimation: toggle({ group: "Startup", label: "Play boot animation", default: true }),
  theme: choice({
    group: "Appearance",
    label: "Theme",
    palette: "Theme",
    attribute: "data-theme",
    default: "light",
    options: [
      ["light", "Light"],
      ["dark", "Dark"],
    ],
  }),
  cursors: choice({
    group: "Appearance",
    label: "Pixel-art cursors",
    attribute: "data-cursors",
    default: "retro",
    checkbox: true,
    options: [
      ["retro", "Pixel art"],
      ["system", "System"],
    ],
  }),
  crt: choice({
    group: "Appearance",
    label: "CRT effect",
    palette: "CRT",
    attribute: "data-crt",
    default: "subtle",
    options: [
      ["off", "Off"],
      ["subtle", "Subtle"],
      ["full", "Full"],
    ],
  }),
  gridSpeed: choice({
    group: "Desktop",
    label: "Grid speed",
    palette: "Grid speed",
    attribute: "data-grid-speed",
    default: "normal",
    options: [
      ["paused", "Paused"],
      ["slow", "Slow"],
      ["normal", "Normal"],
      ["fast", "Fast"],
    ],
  }),
  iconSize: choice({
    group: "Desktop",
    label: "Icon size",
    attribute: "data-icon-size",
    default: "medium",
    options: [
      ["small", "Small"],
      ["medium", "Medium"],
      ["large", "Large"],
    ],
  }),
  restoreSession: toggle({ group: "Desktop", label: "Reopen windows from my last visit", default: false }),
  screensaver: choice({
    group: "Desktop",
    label: "Screensaver",
    default: "3",
    options: [
      ["never", "Never"],
      ["1", "After 1 minute"],
      ["3", "After 3 minutes"],
      ["10", "After 10 minutes"],
    ],
  }),
} satisfies Record<string, SettingSpec>;

type Schema = typeof SETTINGS_SCHEMA;
export type SettingKey = keyof Schema;
export type Settings = { [K in SettingKey]: Schema[K]["default"] };

export type Theme = Settings["theme"];
export type CrtMode = Settings["crt"];
export type GridSpeed = Settings["gridSpeed"];
/** Minutes of inactivity before the screensaver starts, or never. */
export type ScreensaverDelay = Settings["screensaver"];

const KEYS = Object.keys(SETTINGS_SCHEMA) as SettingKey[];

function valuesOf<V extends string>(spec: ChoiceSpec<V>): readonly V[] {
  return spec.options.map(([value]) => value);
}

export const THEMES = valuesOf(SETTINGS_SCHEMA.theme);
export const CRT_MODES = valuesOf(SETTINGS_SCHEMA.crt);
export const GRID_SPEEDS = valuesOf(SETTINGS_SCHEMA.gridSpeed);

export const SETTINGS_STORAGE_KEY = "retro-os:settings";

export const DEFAULT_SETTINGS: Readonly<Settings> = Object.fromEntries(
  KEYS.map((key) => [key, SETTINGS_SCHEMA[key].default]),
) as Settings; // fromEntries loses the key-to-value pairing; built from the schema itself.

function isValid(spec: SettingSpec, value: unknown): boolean {
  if (spec.kind === "toggle") return typeof value === "boolean";
  return typeof value === "string" && spec.options.some(([option]) => option === value);
}

/** Read stored settings, keeping the default for anything missing or invalid. */
export function parseSettings(raw: string | null): Settings {
  const next: Record<string, unknown> = { ...DEFAULT_SETTINGS };
  let parsed: unknown = null;
  try {
    parsed = raw === null ? null : JSON.parse(raw);
  } catch {
    // Malformed storage falls back to the defaults.
  }
  if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
    for (const key of KEYS) {
      const value = (parsed as Record<string, unknown>)[key];
      if (isValid(SETTINGS_SCHEMA[key], value)) next[key] = value;
    }
  }
  return next as Settings; // every key was set from the defaults or validated above
}

/** The screensaver delay in milliseconds, or null when it is off. */
export function screensaverDelayMs(delay: ScreensaverDelay): number | null {
  return delay === "never" ? null : Number(delay) * 60_000;
}

const ROOT_ATTRIBUTES = KEYS.flatMap((key) => {
  const spec: SettingSpec = SETTINGS_SCHEMA[key];
  return spec.kind === "choice" && spec.attribute ? [{ key, attribute: spec.attribute, allowed: valuesOf(spec) }] : [];
});

export function applySettingsToRoot(root: HTMLElement, value: Settings): void {
  for (const rule of ROOT_ATTRIBUTES) root.setAttribute(rule.attribute, String(value[rule.key]));
}

/** The attributes on <html> for these settings, for server rendering. */
export function rootAttributes(value: Settings): Record<string, string> {
  return Object.fromEntries(ROOT_ATTRIBUTES.map((rule) => [rule.attribute, String(value[rule.key])]));
}

function toInlineScriptJson(value: unknown): string {
  return JSON.stringify(value).replaceAll("<", "\\u003C");
}

/**
 * Runs before first paint so stored settings apply without a flash of the
 * defaults. On a page marked `data-bootable` (the desktop at `/`) it also
 * sets `data-boot="pending"` unless the boot animation is off, so CSS covers
 * the server-rendered desktop until the boot sequence takes over. Without
 * JavaScript none of this runs and the desktop shows as rendered.
 */
export const SETTINGS_BOOTSTRAP_SCRIPT = `(() => {
  const root = document.documentElement;
  let parsed = null;
  try {
    const raw = globalThis.localStorage.getItem(${toInlineScriptJson(SETTINGS_STORAGE_KEY)});
    parsed = raw === null ? null : JSON.parse(raw);
  } catch {}
  if (root.hasAttribute("data-bootable") && !(parsed && parsed.bootAnimation === false)) {
    root.setAttribute("data-boot", "pending");
  }
  try {
    if (parsed === null || Array.isArray(parsed) || typeof parsed !== "object") {
      return;
    }
    const rules = ${toInlineScriptJson(ROOT_ATTRIBUTES)};
    for (const rule of rules) {
      const candidate = parsed[rule.key];
      if (typeof candidate === "string" && rule.allowed.includes(candidate)) {
        root.setAttribute(rule.attribute, candidate);
      }
    }
  } catch {}
})();`;
