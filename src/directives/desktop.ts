/**
 * `client:desktop`: hydrate like `client:load`, but only once the island's
 * first app (on an app route) has loaded, which src/apps/preload.ts starts
 * when the island's module runs.
 */
import type { ClientDirective } from "astro";

const desktop: ClientDirective = async (load) => {
  const hydrate = await load();
  await globalThis.__desktopReady?.catch(() => undefined);
  await hydrate();
};

export default desktop;

declare module "astro" {
  interface AstroClientDirectives {
    "client:desktop"?: boolean;
  }
}
