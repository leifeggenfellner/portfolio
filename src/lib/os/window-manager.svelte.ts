/**
 * The window manager: every open window, which is on top, and how each one
 * is laid out.
 *
 * - Windows keep the order they were opened in (the taskbar's order); the
 *   stack is a separate list of ids, bottom to top. z-index comes from a
 *   window's place in the stack, so it never grows past the taskbar.
 * - The active window is always the top-most one that isn't minimised, so
 *   closing or minimising hands focus to the window that was under it.
 * - Layout is a small state machine per window: floating, snapped to a
 *   half (remembering the floating box) or maximised (remembering what it
 *   was before).
 */
import { snapBox } from "@lib/window-bounds";
import type { AppArgs } from "@lib/app-shell";
import type { Viewport, WindowBox } from "@lib/window-bounds";

export type SnapSide = "left" | "right";

type Unmaximised = { kind: "floating" } | { kind: "snapped"; side: SnapSide; restore: WindowBox };
export type Layout = Unmaximised | { kind: "maximized"; previous: Unmaximised };

export interface OpenWindow {
  id: string;
  appId: string;
  title: string;
  icon?: string;
  box: WindowBox;
  args?: AppArgs;
}

/** Where the first window sits in the stacking order; the next goes one above. */
export const WINDOW_Z_BASE = 100;

export class AppWindow {
  readonly id: string;
  readonly appId: string;
  readonly title: string;
  readonly icon: string | undefined;
  /** Where the window is drawn when it isn't maximised. */
  box = $state<WindowBox>({ x: 0, y: 0, w: 0, h: 0 });
  layout = $state<Layout>({ kind: "floating" });
  minimized = $state(false);
  /** The latest launch arguments, handed to the app. */
  args = $state.raw<AppArgs | undefined>();

  constructor(init: OpenWindow) {
    this.id = init.id;
    this.appId = init.appId;
    this.title = init.title;
    this.icon = init.icon;
    this.box = { ...init.box };
    this.args = init.args;
  }

  get maximized(): boolean {
    return this.layout.kind === "maximized";
  }

  get snapped(): SnapSide | null {
    return this.layout.kind === "snapped" ? this.layout.side : null;
  }

  /** The box to go back to when the window floats again. */
  get floatingBox(): WindowBox {
    const base = this.layout.kind === "maximized" ? this.layout.previous : this.layout;
    return base.kind === "snapped" ? base.restore : this.box;
  }
}

/** Says what happened to a window, for screen readers (the kernel's Announcer). */
type Announce = (message: string) => void;

export class WindowManager {
  /** Open windows in the order they were opened. */
  windows = $state<AppWindow[]>([]);
  /** Window ids, bottom to top. */
  #stack = $state<string[]>([]);
  #announce: Announce;

  constructor(announce: Announce = () => {}) {
    this.#announce = announce;
  }

  /** The last element focused inside each window's body, to give focus back to. */
  // eslint-disable-next-line svelte/prefer-svelte-reactivity -- read when a window activates, never rendered
  #focusMemory = new Map<string, HTMLElement>();

  readonly activeId: string | null = $derived(
    [...this.#stack].reverse().find((id) => this.get(id)?.minimized === false) ?? null,
  );

  get(id: string): AppWindow | undefined {
    return this.windows.find((w) => w.id === id);
  }

  /** The window's z-index: its place in the stack above the base. */
  z(id: string): number {
    return WINDOW_Z_BASE + this.#stack.indexOf(id);
  }

  /** The z-index of the top window (the base when none is open). */
  get topZ(): number {
    return WINDOW_Z_BASE + Math.max(this.#stack.length - 1, 0);
  }

  /** Open a window, or bring an open one forward without moving it (new arguments still reach it). */
  open(init: OpenWindow): void {
    const existing = this.get(init.id);
    if (!existing) {
      this.windows.push(new AppWindow(init));
      this.#announce(`${init.title} opened`);
    } else if (init.args) existing.args = init.args;
    this.focus(init.id);
  }

  close(id: string): void {
    const win = this.get(id);
    if (win) this.#announce(`${win.title} closed`);
    this.windows = this.windows.filter((w) => w.id !== id);
    this.#stack = this.#stack.filter((x) => x !== id);
    this.#focusMemory.delete(id);
  }

  /** Raise a window to the top and restore it if minimised. */
  focus(id: string): void {
    const win = this.get(id);
    if (!win) return;
    win.minimized = false;
    if (this.#stack.at(-1) !== id) this.#stack = [...this.#stack.filter((x) => x !== id), id];
  }

  minimize(id: string): void {
    const win = this.get(id);
    if (!win || win.minimized) return;
    win.minimized = true;
    this.#announce(`${win.title} minimised`);
  }

  /** Taskbar button: minimise the active window, otherwise bring the window forward. */
  toggleFromTaskbar(id: string): void {
    if (this.activeId === id) this.minimize(id);
    else this.focus(id);
  }

  move(id: string, x: number, y: number): void {
    const win = this.get(id);
    if (win) win.box = { ...win.box, x, y };
  }

  resize(id: string, w: number, h: number): void {
    const win = this.get(id);
    if (win) win.box = { ...win.box, w, h };
  }

  maximize(id: string): void {
    const win = this.get(id);
    if (!win || win.layout.kind === "maximized") return;
    win.layout = { kind: "maximized", previous: win.layout };
    this.#announce(`${win.title} maximised`);
  }

  toggleMax(id: string): void {
    const win = this.get(id);
    if (!win) return;
    if (win.layout.kind === "maximized") {
      win.layout = win.layout.previous;
      this.#announce(`${win.title} restored`);
    } else this.maximize(id);
  }

  /** Snap to half of `area`, remembering the floating box from before the first snap. */
  snap(id: string, side: SnapSide, area: Viewport): void {
    const win = this.get(id);
    if (!win) return;
    const restore = win.floatingBox;
    win.box = snapBox(side, area);
    win.layout = { kind: "snapped", side, restore };
    this.#announce(`${win.title} snapped to the ${side} half`);
  }

  /**
   * Back to floating at the old size: one step down from maximised, or out
   * of a snap at `at` (or the old spot). Returns false if it was floating.
   */
  restore(id: string, at?: { x: number; y: number }): boolean {
    const win = this.get(id);
    if (!win || win.layout.kind === "floating") return false;
    if (win.layout.kind === "maximized") {
      win.layout = win.layout.previous;
    } else {
      win.box = { ...win.layout.restore, ...at };
      win.layout = { kind: "floating" };
    }
    this.#announce(`${win.title} restored`);
    return true;
  }

  /** Arrow-key snapping: left/right halves, up maximises, down steps back. */
  snapKey(id: string, direction: "left" | "right" | "up" | "down", area: Viewport): void {
    if (direction === "up") this.maximize(id);
    else if (direction === "down") this.restore(id);
    else this.snap(id, direction, area);
  }

  /** Every window floating and on screen, stepped from the top left, the last one on top. */
  cascade(): void {
    this.windows.forEach((win, i) => {
      const { w, h } = win.floatingBox;
      win.box = { x: 32 + i * 28, y: 32 + i * 28, w, h };
      win.layout = { kind: "floating" };
      win.minimized = false;
    });
    this.#stack = this.windows.map((w) => w.id);
  }

  rememberFocus(id: string, el: HTMLElement): void {
    this.#focusMemory.set(id, el);
  }

  /** The element focus should return to in this window, if it is still there. */
  rememberedFocus(id: string): HTMLElement | null {
    const el = this.#focusMemory.get(id);
    return el?.isConnected ? el : null;
  }
}
