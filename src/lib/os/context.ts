/**
 * The OS kernel: the services the desktop and its apps share, created
 * together and handed down through Svelte context from the island root, so
 * every mount (and every test) gets its own.
 */
import { getContext, setContext } from "svelte";
import { Boot } from "./boot.svelte";
import { Keymap } from "./keymap.svelte";
import { Launcher } from "./launcher.svelte";
import { SettingsService } from "./settings.svelte";
import { Viewport } from "./viewport.svelte";
import { WindowManager } from "./window-manager.svelte";
import type { AppManifest } from "@lib/app-shell";

export interface Os {
  windows: WindowManager;
  settings: SettingsService;
  keymap: Keymap;
  boot: Boot;
  viewport: Viewport;
  launcher: Launcher;
}

const KEY = Symbol("os");

/** `apps` come from the caller so the kernel never imports the app layer above it. */
export function createOs(apps: readonly AppManifest[] = []): Os {
  const windows = new WindowManager();
  const viewport = new Viewport();
  return {
    windows,
    settings: new SettingsService(),
    keymap: new Keymap(),
    boot: new Boot(),
    viewport,
    launcher: new Launcher(apps, windows, viewport),
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
