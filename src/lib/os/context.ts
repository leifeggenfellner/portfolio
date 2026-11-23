/**
 * The OS kernel: the services the desktop and its apps share, created
 * together and handed down through Svelte context from the island root, so
 * every mount (and every test) gets its own.
 */
import { getContext, setContext } from "svelte";
import { SettingsService } from "./settings.svelte";
import { WindowManager } from "./window-manager.svelte";

export interface Os {
  windows: WindowManager;
  settings: SettingsService;
}

const KEY = Symbol("os");

export function createOs(): Os {
  return { windows: new WindowManager(), settings: new SettingsService() };
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
