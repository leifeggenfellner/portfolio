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
  store.update((s) => ({
    windows: s.windows.filter((w) => w.id !== id),
    activeId: s.activeId === id ? null : s.activeId,
    zCursor: s.zCursor,
  }));
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
  store.update((s) => ({
    windows: s.windows.map((w) => (w.id === id ? { ...w, minimized: true } : w)),
    activeId: s.activeId === id ? null : s.activeId,
    zCursor: s.zCursor,
  }));
}

function toggleMax(id: string) {
  store.update((s) => ({
    ...s,
    windows: s.windows.map((w) => (w.id === id ? { ...w, maximized: !w.maximized } : w)),
  }));
}

function reset(snapshot?: WindowManagerSnapshot) {
  store.set(snapshot ?? initial);
}

function cascade() {
  store.update((s) => ({
    ...s,
    windows: s.windows.map((w, i) => ({
      ...w,
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
  toggleMax,
  reset,
  cascade,
};
