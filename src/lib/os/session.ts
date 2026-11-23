/**
 * The desktop between visits (the "Reopen windows" setting): which windows
 * were open, where, and in what order. Stored as JSON; anything malformed,
 * or an app that no longer exists, is dropped rather than trusted.
 */
import type { Layout } from "./window-manager.svelte";
import type { AppArgs } from "@lib/app-shell";
import type { WindowBox } from "@lib/window-bounds";

export const SESSION_STORAGE_KEY = "retro-os:session";

export interface SessionWindow {
  appId: string;
  args?: AppArgs;
  box: WindowBox;
  layout: Layout;
  minimized: boolean;
}

const isNumber = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

function parseBox(v: unknown): WindowBox | null {
  if (!isObject(v) || ![v.x, v.y, v.w, v.h].every(isNumber)) return null;
  return { x: v.x as number, y: v.y as number, w: v.w as number, h: v.h as number };
}

function parseArgs(v: unknown): AppArgs | undefined {
  if (!isObject(v)) return undefined;
  const entries = Object.entries(v).filter((entry): entry is [string, string] => typeof entry[1] === "string");
  return entries.length ? Object.fromEntries(entries) : undefined;
}

function parseLayout(v: unknown): Layout {
  if (!isObject(v)) return { kind: "floating" };
  const snapped = (s: unknown) => {
    if (!isObject(s) || s.kind !== "snapped" || (s.side !== "left" && s.side !== "right")) return null;
    const restore = parseBox(s.restore);
    return restore ? { kind: "snapped" as const, side: s.side as "left" | "right", restore } : null;
  };
  if (v.kind === "maximized") {
    return { kind: "maximized", previous: snapped(v.previous) ?? { kind: "floating" } };
  }
  return snapped(v) ?? { kind: "floating" };
}

/** Stored windows, bottom to top, keeping only apps in `appIds`. */
export function parseSession(raw: string | null, appIds: readonly string[]): SessionWindow[] {
  let data: unknown;
  try {
    data = raw === null ? [] : JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];
  return data.flatMap((item): SessionWindow[] => {
    if (!isObject(item) || typeof item.appId !== "string" || !appIds.includes(item.appId)) return [];
    const box = parseBox(item.box);
    if (!box) return [];
    return [
      {
        appId: item.appId,
        args: parseArgs(item.args),
        box,
        layout: parseLayout(item.layout),
        minimized: item.minimized === true,
      },
    ];
  });
}

function storage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function readSession(appIds: readonly string[]): SessionWindow[] {
  try {
    return parseSession(storage()?.getItem(SESSION_STORAGE_KEY) ?? null, appIds);
  } catch {
    return [];
  }
}

/** Store the session, or forget it with `null`. Storage failures only cost the memory. */
export function writeSession(windows: readonly SessionWindow[] | null): void {
  try {
    if (windows) storage()?.setItem(SESSION_STORAGE_KEY, JSON.stringify(windows));
    else storage()?.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Not remembered this time.
  }
}
