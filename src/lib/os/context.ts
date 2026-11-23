/**
 * The OS kernel: the services the desktop and its apps share, created
 * together and handed down through Svelte context from the island root, so
 * every mount (and every test) gets its own.
 */
import { getContext, setContext } from "svelte";
import { Announcer } from "./announcer.svelte";
import { Boot } from "./boot.svelte";
import { Keymap } from "./keymap.svelte";
import { Launcher } from "./launcher.svelte";
import { Navigation } from "./navigation.svelte";
import { SettingsService } from "./settings.svelte";
import { Updates } from "./updates.svelte";
import { Viewport } from "./viewport.svelte";
import { WindowManager } from "./window-manager.svelte";
import type { AppArgs, AppManifest } from "@lib/app-shell";

export interface Os {
  announcer: Announcer;
  windows: WindowManager;
  settings: SettingsService;
  keymap: Keymap;
  boot: Boot;
  viewport: Viewport;
  launcher: Launcher;
  navigation: Navigation;
  updates: Updates;
}

const KEY = Symbol("os");

/** The window a page opens with: an app route such as `/projects/retro-os/`. */
export interface InitialWindow {
  appId: string;
  args?: AppArgs;
}

/** `apps` come from the caller so the kernel never imports the app layer above it. */
export function createOs(apps: readonly AppManifest[] = [], initial?: InitialWindow): Os {
  const announcer = new Announcer();
  const windows = new WindowManager((message) => announcer.announce(message));
  const viewport = new Viewport();
  const launcher = new Launcher(apps, windows, viewport);
  if (initial) launcher.openInitial(initial.appId, initial.args);
  return {
    announcer,
    windows,
    settings: new SettingsService(),
    keymap: new Keymap(),
    boot: new Boot(),
    viewport,
    launcher,
    navigation: new Navigation(windows, launcher, import.meta.env.BASE_URL),
    updates: new Updates(),
  };
}

export function setOs(os: Os): Os {
  return setContext(KEY, os);
}

export function getOs(): Os {
  const os = getContext<Os | undefined>(KEY);
  if (!os) throw new Error("getOs() was called outside the OS root");
  return os;
}

/** Context for mounting a component on its own, e.g. `render(App, { context: osContext(os) })`. */
export function osContext(os: Os = createOs()): Map<symbol, Os> {
  return new Map([[KEY, os]]);
}
