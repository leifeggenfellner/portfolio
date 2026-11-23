export type Theme = "light" | "dark";
export type CrtMode = "off" | "subtle" | "full";
export type GridSpeed = "paused" | "slow" | "normal" | "fast";
export type IconSize = "small" | "medium" | "large";
/** The desktop's pixel-art cursors, or the platform's own. */
export type CursorStyle = "retro" | "system";
/** Minutes of inactivity before the screensaver starts, or never. */
export type ScreensaverDelay = "never" | "1" | "3" | "10";

export type Settings = {
  bootAnimation: boolean;
  theme: Theme;
  crt: CrtMode;
  gridSpeed: GridSpeed;
  iconSize: IconSize;
  screensaver: ScreensaverDelay;
  cursors: CursorStyle;
};

export const THEMES: readonly Theme[] = ["light", "dark"];
export const CRT_MODES: readonly CrtMode[] = ["off", "subtle", "full"];
export const GRID_SPEEDS: readonly GridSpeed[] = ["paused", "slow", "normal", "fast"];
export const ICON_SIZES: readonly IconSize[] = ["small", "medium", "large"];
export const SCREENSAVER_DELAYS: readonly ScreensaverDelay[] = ["never", "1", "3", "10"];
export const CURSOR_STYLES: readonly CursorStyle[] = ["retro", "system"];

export const SETTINGS_STORAGE_KEY = "retro-os:settings";

export const DEFAULT_SETTINGS: Readonly<Settings> = {
  bootAnimation: true,
  theme: "light",
  crt: "subtle",
  gridSpeed: "normal",
  iconSize: "medium",
  screensaver: "3",
  cursors: "retro",
};

const ROOT_ATTRIBUTE_RULES = [
  { key: "theme", attribute: "data-theme", allowed: THEMES },
  { key: "crt", attribute: "data-crt", allowed: CRT_MODES },
  { key: "gridSpeed", attribute: "data-grid-speed", allowed: GRID_SPEEDS },
  { key: "iconSize", attribute: "data-icon-size", allowed: ICON_SIZES },
  { key: "cursors", attribute: "data-cursors", allowed: CURSOR_STYLES },
] as const;

function isAllowedValue<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value);
}

function parseObject(raw: string | null): Record<string, unknown> | null {
  if (raw === null) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed === null || Array.isArray(parsed) || typeof parsed !== "object") {
      return null;
    }
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function parseSettings(raw: string | null): Settings {
  const parsed = parseObject(raw);
  const next: Settings = { ...DEFAULT_SETTINGS };

  if (parsed === null) {
    return next;
  }

  const bootAnimation = parsed.bootAnimation;
  if (typeof bootAnimation === "boolean") {
    next.bootAnimation = bootAnimation;
  }

  const theme = parsed.theme;
  if (isAllowedValue(theme, THEMES)) {
    next.theme = theme;
  }

  const crt = parsed.crt;
  if (isAllowedValue(crt, CRT_MODES)) {
    next.crt = crt;
  }

  const gridSpeed = parsed.gridSpeed;
  if (isAllowedValue(gridSpeed, GRID_SPEEDS)) {
    next.gridSpeed = gridSpeed;
  }

  const iconSize = parsed.iconSize;
  if (isAllowedValue(iconSize, ICON_SIZES)) {
    next.iconSize = iconSize;
  }

  const screensaver = parsed.screensaver;
  if (isAllowedValue(screensaver, SCREENSAVER_DELAYS)) {
    next.screensaver = screensaver;
  }

  const cursors = parsed.cursors;
  if (isAllowedValue(cursors, CURSOR_STYLES)) {
    next.cursors = cursors;
  }

  return next;
}

/** The screensaver delay in milliseconds, or null when it is off. */
export function screensaverDelayMs(delay: ScreensaverDelay): number | null {
  return delay === "never" ? null : Number(delay) * 60_000;
}

export function applySettingsToRoot(root: HTMLElement, value: Settings): void {
  for (const rule of ROOT_ATTRIBUTE_RULES) {
    root.setAttribute(rule.attribute, value[rule.key]);
  }
}

const bootstrapRules = ROOT_ATTRIBUTE_RULES.map((rule) => ({
  key: rule.key,
  attribute: rule.attribute,
  allowed: rule.allowed,
}));

function toInlineScriptJson(value: unknown): string {
  return JSON.stringify(value).replaceAll("<", "\\u003C");
}

export const SETTINGS_BOOTSTRAP_SCRIPT = `(() => {
  try {
    const key = ${toInlineScriptJson(SETTINGS_STORAGE_KEY)};
    if (!("localStorage" in globalThis)) {
      return;
    }
    const raw = globalThis.localStorage.getItem(key);
    if (raw === null) {
      return;
    }
    const parsed = JSON.parse(raw);
    if (parsed === null || Array.isArray(parsed) || typeof parsed !== "object") {
      return;
    }
    const root = document.documentElement;
    const rules = ${toInlineScriptJson(bootstrapRules)};
    for (const rule of rules) {
      const candidate = parsed[rule.key];
      if (typeof candidate === "string" && rule.allowed.includes(candidate)) {
        root.setAttribute(rule.attribute, candidate);
      }
    }
  } catch {}
})();`;
