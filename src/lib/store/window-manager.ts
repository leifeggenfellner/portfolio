/**
 * Window manager store (zustand).
 *
 * Single source of truth for every open window: position, size,
 * z-index, focus, minimized/maximized state. Apps are registered
 * separately (id + title + icon + render); a window holds an
 * `appId` reference so the same app can be opened many times.
 *
 * Design intent:
 *  - No window component owns its own state — they're controlled.
 *  - Focus bumps z-index via a monotonic counter; we never have
 *    to re-sort the array.
 *  - Persistence is opt-in (last theme/positions saved to LS).
 */
import { create } from "zustand";

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

interface WindowManagerState {
  windows: WindowState[];
  activeId: string | null;
  zCursor: number;
  open: (
    w: Omit<WindowState, "z" | "minimized" | "maximized"> &
      Partial<Pick<WindowState, "minimized" | "maximized">>,
  ) => void;
  close: (id: string) => void;
  focus: (id: string) => void;
  move: (id: string, x: number, y: number) => void;
  resize: (id: string, w: number, h: number) => void;
  minimize: (id: string) => void;
  toggleMax: (id: string) => void;
}

export const useWindowManager = create<WindowManagerState>((set) => ({
  windows: [],
  activeId: null,
  zCursor: 100,
  open: (w) =>
    set((s) => {
      const existing = s.windows.find((x) => x.id === w.id);
      if (existing) {
        return {
          windows: s.windows.map((x) =>
            x.id === w.id ? { ...x, minimized: false, z: s.zCursor + 1 } : x,
          ),
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
    }),
  close: (id) =>
    set((s) => ({
      windows: s.windows.filter((w) => w.id !== id),
      activeId: s.activeId === id ? null : s.activeId,
    })),
  focus: (id) =>
    set((s) => {
      if (s.activeId === id && s.windows.find((w) => w.id === id)?.z === s.zCursor) return s;
      return {
        windows: s.windows.map((w) =>
          w.id === id ? { ...w, z: s.zCursor + 1, minimized: false } : w,
        ),
        activeId: id,
        zCursor: s.zCursor + 1,
      };
    }),
  move: (id, x, y) =>
    set((s) => ({ windows: s.windows.map((w) => (w.id === id ? { ...w, x, y } : w)) })),
  resize: (id, w, h) =>
    set((s) => ({ windows: s.windows.map((x) => (x.id === id ? { ...x, w, h } : x)) })),
  minimize: (id) =>
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, minimized: true } : w)),
      activeId: s.activeId === id ? null : s.activeId,
    })),
  toggleMax: (id) =>
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, maximized: !w.maximized } : w)),
    })),
}));
