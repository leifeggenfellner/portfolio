/**
 * In the browser, before the desktop hydrates: when the page is an app route
 * (`/terminal/`, `/projects/retro-os/`), start loading that app's component,
 * so the hydrating window renders the same content the server did. The
 * `client:desktop` directive (src/directives/desktop.ts) waits for it.
 *
 * Not top-level await: the app's chunk imports kernel modules from this
 * same island, and awaiting it while the island is still evaluating would
 * deadlock.
 */
import { provideAppComponent } from "@lib/os/app-components";
import { APPS } from "./registry";

/** The app whose route `pathname` is, if any. */
export function appForPath(pathname: string, base = "/") {
  const path = `/${pathname.slice(base.length).replace(/^\/+/, "")}`.replace(/\/?$/, "/");
  return APPS.find((app) => path.startsWith(app.route));
}

if (!import.meta.env.SSR) {
  const app = appForPath(location.pathname, import.meta.env.BASE_URL);
  globalThis.__desktopReady = app?.load().then((module) => provideAppComponent(app.id, module.default));
}
