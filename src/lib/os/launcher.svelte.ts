/**
 * Opens apps: loads an interactive app's code on first open (so opening the
 * Terminal doesn't download Minesweeper), reads a static app's server-rendered
 * HTML, fits the window to the screen and hands it to the window manager.
 */
import { fitWindowToViewport } from "@lib/window-bounds";
import type { Viewport } from "./viewport.svelte";
import type { WindowManager } from "./window-manager.svelte";
import type { AppManifest, AppProps, AppShell } from "@lib/app-shell";
import type { Component } from "svelte";

export class Launcher {
  readonly apps: readonly AppManifest[];
  /** Apps whose code is downloading; the busy cursor shows meanwhile. */
  loading = $state(0);
  #components = $state<Record<string, Component<AppProps>>>({});
  #html = $state<Record<string, string>>({});
  #windows: WindowManager;
  #viewport: Viewport;
  // Where each window should grow from next time it appears: the icon or
  // taskbar button that summoned it. Read once by the window's intro.
  #origins = new Map<string, DOMRect>();
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
    return this.#components[appId];
  }

  html(appId: string): string {
    return this.#html[appId] ?? "";
  }

  setOrigin(windowId: string, rect: DOMRect): void {
    this.#origins.set(windowId, rect);
  }

  origin(windowId: string): DOMRect | null {
    return this.#origins.get(windowId) ?? null;
  }

  /** Open an app (or bring its window forward). Resolves false if its code failed to load. */
  async open(appId: string, origin?: DOMRect): Promise<boolean> {
    const app = this.app(appId);
    if (!app) return false;
    if (origin) this.setOrigin(app.id, origin);
    if (app.kind === "svelte" ? !(await this.#load(app.id, app.load)) : !this.#readStatic(app.id)) return false;
    // Read the screen live: a resize event may not have landed yet.
    const box = this.#viewport.mobile
      ? app.defaults
      : fitWindowToViewport(app.defaults, {
          width: window.innerWidth,
          height: window.innerHeight - this.#viewport.taskbarHeight,
        });
    this.#windows.open({ id: app.id, appId: app.id, title: app.title, icon: app.icon, box });
    return true;
  }

  /** What an app in `windowId` may ask of the desktop; one per window, so apps get a stable prop. */
  shellFor(windowId: string): AppShell {
    let shell = this.#shells.get(windowId);
    if (!shell) {
      shell = {
        apps: this.apps.map(({ id, title, icon }) => ({ id, title, icon })),
        open: (appId) => void this.open(appId),
        close: () => this.#windows.close(windowId),
      };
      this.#shells.set(windowId, shell);
    }
    return shell;
  }

  async #load(appId: string, load: () => Promise<{ default: Component<AppProps> }>): Promise<boolean> {
    if (this.#components[appId]) return true;
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

  #readStatic(appId: string): boolean {
    this.#html[appId] ??=
      document.querySelector<HTMLTemplateElement>(`template[data-static-app="${appId}"]`)?.innerHTML ?? "";
    return true;
  }
}
