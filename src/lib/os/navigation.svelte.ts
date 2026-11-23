/**
 * Windows are routes. The URL follows the active window (`/terminal/`,
 * `/projects/retro-os/`, or `/` with none), so any view can be shared or
 * reloaded, and the browser's Back and Forward move through windows:
 *
 * - opening a window pushes its page; focusing, retargeting or closing one
 *   replaces the current entry (closing doesn't pop: history can't be
 *   rewritten in place, and a stray Back would reopen nothing useful)
 * - Back closes the window that entry opened and shows the page before it;
 *   Forward opens the window again
 * - the tab title follows the active window, as the server's would
 */
import { tick, untrack } from "svelte";
import { HOME_TITLE, pageTitle } from "@lib/site";
import type { Launcher } from "./launcher.svelte";
import type { WindowManager } from "./window-manager.svelte";
import type { AppArgs, AppManifest } from "@lib/app-shell";

interface Entry {
  /** Position in this tab's history, to tell Back from Forward. */
  depth: number;
}

export class Navigation {
  #windows: WindowManager;
  #launcher: Launcher;
  #base: string;
  #depth = 0;
  // eslint-disable-next-line svelte/prefer-svelte-reactivity -- bookkeeping for history, never rendered
  #known = new Set<string>();
  #quiet = 0;

  /** Run `work` without pushing history entries (restoring a session opens several windows at once). */
  async quietly(work: () => Promise<void>): Promise<void> {
    this.#quiet++;
    try {
      await work();
    } finally {
      // Let the last window's sync run before entries push again.
      await tick();
      this.#quiet--;
    }
  }

  constructor(windows: WindowManager, launcher: Launcher, base = "/") {
    this.#windows = windows;
    this.#launcher = launcher;
    this.#base = base.endsWith("/") ? base : `${base}/`;
  }

  /** The page for an app opened with these arguments. */
  pathFor(app: AppManifest, args?: AppArgs): string {
    const rest = args && app.subpath?.fromArgs(args);
    return `${this.#base}${app.route.slice(1)}${rest ? `${rest}/` : ""}`;
  }

  /** The app and arguments a path opens, or null for the desktop alone. */
  resolve(pathname: string): { app: AppManifest; args?: AppArgs } | null {
    const path = `/${pathname.slice(this.#base.length).replace(/^\/+|\/+$/g, "")}/`;
    const app = this.#launcher.apps.find((a) => path.startsWith(a.route));
    if (!app) return null;
    const rest = path.slice(app.route.length).replace(/\/$/, "");
    return { app, args: rest ? app.subpath?.toArgs(rest) : undefined };
  }

  /** Start following history; returns the function that stops. */
  listen(): () => void {
    // Untracked: listen runs in an effect, which must not re-run (and re-learn every window) as windows open.
    untrack(() => this.#windows.windows.forEach((w) => this.#known.add(w.id)));
    const state = history.state as Entry | null;
    this.#depth = state?.depth ?? 0;
    history.replaceState({ depth: this.#depth } satisfies Entry, "");
    const onPop = (e: PopStateEvent) => void this.#onPop(e);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }

  /** Bring the URL and title in line with the active window. Call when it, or its arguments, change. */
  sync(): void {
    const id = this.#windows.activeId;
    const win = id ? this.#windows.get(id) : undefined;
    const app = win && this.#launcher.app(win.appId);
    const path = app ? this.pathFor(app, win.args) : this.#base;
    document.title = win ? pageTitle(win.title) : HOME_TITLE;
    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- a one-off string, not state
    document.querySelector('link[rel="canonical"]')?.setAttribute("href", new URL(path, location.origin).href);
    // Drop windows that closed, so reopening one counts as new.
    for (const known of this.#known) if (!this.#windows.get(known)) this.#known.delete(known);
    const opened = win !== undefined && !this.#known.has(win.id);
    if (win) this.#known.add(win.id);
    if (path === location.pathname) return;
    if (opened && this.#quiet === 0) history.pushState({ depth: ++this.#depth } satisfies Entry, "", path);
    else history.replaceState({ depth: this.#depth } satisfies Entry, "", path);
  }

  async #onPop(e: PopStateEvent): Promise<void> {
    const depth = (e.state as Entry | null)?.depth ?? 0;
    const back = depth < this.#depth;
    this.#depth = depth;
    const target = this.resolve(location.pathname);
    const active = this.#windows.activeId;
    // Back leaves the entry the active window was opened with: close it.
    if (back && active && (!target || this.#windows.get(active)?.appId !== target.app.id)) {
      this.#windows.close(active);
    }
    if (target) await this.#launcher.open(target.app.id, { args: target.args });
  }
}
