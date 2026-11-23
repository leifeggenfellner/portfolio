/**
 * Window manager store (Svelte writable).
 *
 * Single source of truth for every open window: position, size,
 * z-index, focus, minimized/maximized state. Apps are registered
 * separately (id + title + icon + load); a window holds an
 * `appId` reference so the same app can be opened many times.
 *
 * Design intent:
 *  - No window component owns its own state — they're controlled.
 *  - Focus bumps z-index via a monotonic counter; we never have
 *    to re-sort the array.
 *  - Persistence is opt-in (last theme/positions saved to LS).
 */
import { writable, get } from "svelte/store";

export interface WindowState {
  id: string;
  appId: string;
  title: string;
  icon?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  minimized: boolean;
  maximized: boolean;
  /** Snapped to half of the desktop, and the box to go back to when unsnapped. */
  snapped?: { zone: "left" | "right"; restore: { x: number; y: number; w: number; h: number } };
}

export interface WindowManagerSnapshot {
  windows: WindowState[];
  activeId: string | null;
  zCursor: number;
}

export type OpenPayload = Omit<WindowState, "z" | "minimized" | "maximized"> &
  Partial<Pick<WindowState, "minimized" | "maximized">>;

const initial: WindowManagerSnapshot = {
  windows: [],
  activeId: null,
  zCursor: 100,
};

const store = writable<WindowManagerSnapshot>(initial);

/** The window that should hold focus: the top-most one that is not minimised. */
function topVisibleId(windows: WindowState[], exceptId?: string): string | null {
  let top: WindowState | null = null;
  for (const w of windows) {
    if (w.minimized || w.id === exceptId) continue;
    if (!top || w.z > top.z) top = w;
  }
  return top?.id ?? null;
}

function open(w: OpenPayload) {
  store.update((s) => {
    const existing = s.windows.find((x) => x.id === w.id);
    if (existing) {
      return {
        windows: s.windows.map((x) => (x.id === w.id ? { ...x, minimized: false, z: s.zCursor + 1 } : x)),
        activeId: w.id,
        zCursor: s.zCursor + 1,
      };
    }
    const next: WindowState = {
      minimized: false,
      maximized: false,
      ...w,
      z: s.zCursor + 1,
    };
    return { windows: [...s.windows, next], activeId: w.id, zCursor: s.zCursor + 1 };
  });
}

function close(id: string) {
  store.update((s) => {
    const windows = s.windows.filter((w) => w.id !== id);
    return {
      windows,
      activeId: s.activeId === id ? topVisibleId(windows) : s.activeId,
      zCursor: s.zCursor,
    };
  });
}

function focus(id: string) {
  store.update((s) => {
    if (s.activeId === id && s.windows.find((w) => w.id === id)?.z === s.zCursor) return s;
    return {
      windows: s.windows.map((w) => (w.id === id ? { ...w, z: s.zCursor + 1, minimized: false } : w)),
      activeId: id,
      zCursor: s.zCursor + 1,
    };
  });
}

function move(id: string, x: number, y: number) {
  store.update((s) => ({ ...s, windows: s.windows.map((w) => (w.id === id ? { ...w, x, y } : w)) }));
}

function resize(id: string, w: number, h: number) {
  store.update((s) => ({ ...s, windows: s.windows.map((x) => (x.id === id ? { ...x, w, h } : x)) }));
}

function minimize(id: string) {
  store.update((s) => {
    const windows = s.windows.map((w) => (w.id === id ? { ...w, minimized: true } : w));
    return {
      windows,
      activeId: s.activeId === id ? topVisibleId(windows) : s.activeId,
      zCursor: s.zCursor,
    };
  });
}

/** Taskbar button: minimise the active window, otherwise bring the window forward. */
function toggleFromTaskbar(id: string) {
  const s = get(store);
  const target = s.windows.find((w) => w.id === id);
  if (!target) return;
  if (s.activeId === id && !target.minimized) minimize(id);
  else focus(id);
}

function toggleMax(id: string) {
  store.update((s) => ({
    ...s,
    windows: s.windows.map((w) => (w.id === id ? { ...w, maximized: !w.maximized } : w)),
  }));
}

/** Snap a window to half of the desktop, remembering its box from before the first snap. */
function snap(id: string, zone: "left" | "right", box: { x: number; y: number; w: number; h: number }) {
  store.update((s) => ({
    ...s,
    windows: s.windows.map((w) =>
      w.id === id
        ? {
            ...w,
            ...box,
            maximized: false,
            snapped: { zone, restore: w.snapped?.restore ?? { x: w.x, y: w.y, w: w.w, h: w.h } },
          }
        : w,
    ),
  }));
}

/** Put a snapped window back to its old size, at `x` (or its old spot). Returns false if it wasn't snapped. */
function unsnap(id: string, at?: { x: number; y: number }): boolean {
  const target = get(store).windows.find((w) => w.id === id);
  const restore = target?.snapped?.restore;
  if (!restore) return false;
  store.update((s) => ({
    ...s,
    windows: s.windows.map((w) => (w.id === id ? { ...w, ...restore, ...at, snapped: undefined } : w)),
  }));
  return true;
}

function reset(snapshot?: WindowManagerSnapshot) {
  store.set(snapshot ?? initial);
}

function cascade() {
  store.update((s) => ({
    ...s,
    windows: s.windows.map((w, i) => ({
      ...w,
      ...(w.snapped ? { w: w.snapped.restore.w, h: w.snapped.restore.h } : {}),
      snapped: undefined,
      x: 32 + i * 28,
      y: 32 + i * 28,
      maximized: false,
      minimized: false,
      z: s.zCursor + i + 1,
    })),
    activeId: s.windows[s.windows.length - 1]?.id ?? null,
    zCursor: s.zCursor + s.windows.length,
  }));
}

/** Svelte-friendly store: subscribe, get snapshot, call actions. */
export const windowManager = {
  subscribe: store.subscribe,
  get: () => get(store),
  open,
  close,
  focus,
  move,
  resize,
  minimize,
  toggleFromTaskbar,
  toggleMax,
  snap,
  unsnap,
  reset,
  cascade,
};
