/**
 * Opens apps: loads an app's code on first open (so opening the Terminal
 * doesn't download Minesweeper), fits the window to the screen and hands it
 * to the window manager.
 */
import { fitWindowToViewport, snapBox } from "@lib/window-bounds";
import { loadedAppComponent } from "./app-components";
import type { SessionWindow } from "./session";
import type { Viewport } from "./viewport.svelte";
import type { WindowManager } from "./window-manager.svelte";
import type { AppArgs, AppManifest, AppProps, AppShell } from "@lib/app-shell";
import type { WindowBox } from "@lib/window-bounds";
import type { Component } from "svelte";

export class Launcher {
  readonly apps: readonly AppManifest[];
  /** Apps whose code is downloading; the busy cursor shows meanwhile. */
  loading = $state(0);
  #components = $state<Record<string, Component<AppProps>>>({});
  #windows: WindowManager;
  #viewport: Viewport;
  // Where each window should grow from next time it appears: the icon or
  // taskbar button that summoned it. Read once by the window's intro.
  // eslint-disable-next-line svelte/prefer-svelte-reactivity -- read once when a window opens, never rendered
  #origins = new Map<string, DOMRect>();
  // eslint-disable-next-line svelte/prefer-svelte-reactivity -- a stable object per window, never rendered
  #shells = new Map<string, AppShell>();

  constructor(apps: readonly AppManifest[], windows: WindowManager, viewport: Viewport) {
    this.apps = apps;
    this.#windows = windows;
    this.#viewport = viewport;
  }

  app(appId: string): AppManifest | undefined {
    return this.apps.find((a) => a.id === appId);
  }

  component(appId: string): Component<AppProps> | undefined {
    return this.#components[appId] ?? loadedAppComponent(appId);
  }

  setOrigin(windowId: string, rect: DOMRect): void {
    this.#origins.set(windowId, rect);
  }

  origin(windowId: string): DOMRect | null {
    return this.#origins.get(windowId) ?? null;
  }

  /**
   * Open an app (or bring its window forward) with optional arguments, which
   * the app's manifest checks first. Resolves false if its code failed to load.
   */
  async open(appId: string, { args, origin }: { args?: AppArgs; origin?: DOMRect } = {}): Promise<boolean> {
    const app = this.app(appId);
    if (!app) return false;
    if (origin) this.setOrigin(app.id, origin);
    if (!(await this.#load(app.id, app.load))) return false;
    // Read the screen live: a resize event may not have landed yet.
    const box = this.#viewport.mobile
      ? app.defaults
      : fitWindowToViewport(app.defaults, {
          width: window.innerWidth,
          height: window.innerHeight - this.#viewport.taskbarHeight,
        });
    this.#windows.open({
      id: app.id,
      appId: app.id,
      title: app.title,
      icon: app.icon,
      box,
      args: this.#parse(app, args),
    });
    return true;
  }

  /**
   * Open the window a page starts with (an app route), synchronously and at
   * its default size, so the server and the first client render agree. The
   * app's component must already be provided (see app-components).
   */
  openInitial(appId: string, args?: AppArgs): void {
    const app = this.app(appId);
    if (!app || !this.component(appId)) return;
    this.#windows.open({
      id: app.id,
      appId: app.id,
      title: app.title,
      icon: app.icon,
      box: app.defaults,
      args: this.#parse(app, args),
    });
  }

  /**
   * Reopen a stored session, bottom window first so the stacking comes back.
   * Boxes are fitted to today's screen; layouts and minimised states return.
   * A window that is already open (the page's own) keeps its arguments and
   * only gets its arrangement back.
   */
  async restore(saved: readonly SessionWindow[]): Promise<void> {
    const area = { width: window.innerWidth, height: window.innerHeight - this.#viewport.taskbarHeight };
    for (const entry of saved) {
      if (this.#windows.get(entry.appId)) this.#windows.focus(entry.appId);
      else if (!(await this.open(entry.appId, { args: entry.args }))) continue;
      const fit = (box: WindowBox) => fitWindowToViewport(box, area);
      // A snapped window snaps again to today's screen; its floating box is fitted.
      const { layout } = entry;
      const box = layout.kind === "snapped" ? snapBox(layout.side, area) : fit(entry.box);
      const restoredLayout = layout.kind === "snapped" ? { ...layout, restore: fit(layout.restore) } : layout;
      this.#windows.arrange(entry.appId, { box, layout: restoredLayout, minimized: entry.minimized });
    }
  }

  #parse(app: AppManifest, args: AppArgs | undefined): AppArgs | undefined {
    return args && app.parseArgs ? app.parseArgs(args) : undefined;
  }

  /** What an app in `windowId` may ask of the desktop; one per window, so apps get a stable prop. */
  shellFor(windowId: string): AppShell {
    let shell = this.#shells.get(windowId);
    if (!shell) {
      shell = {
        apps: this.apps.map(({ id, title, icon }) => ({ id, title, icon })),
        open: (appId, args) => void this.open(appId, { args }),
        close: () => this.#windows.close(windowId),
      };
      this.#shells.set(windowId, shell);
    }
    return shell;
  }

  async #load(appId: string, load: () => Promise<{ default: Component<AppProps> }>): Promise<boolean> {
    if (this.component(appId)) return true;
    this.loading += 1;
    try {
      this.#components[appId] = (await load()).default;
      return true;
    } catch (error) {
      console.error(`Failed to load app "${appId}"`, error);
      return false;
    } finally {
      this.loading -= 1;
    }
  }
}
