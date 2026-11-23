/**
 * Server only (imported from Astro pages): every app component, eagerly, so
 * any app route renders its window's real content at build time. The
 * browser never imports this; it loads apps through their manifests.
 */
import { provideAppComponent } from "@lib/os/app-components";
import type { AppProps } from "@lib/app-shell";
import type { Component } from "svelte";

const components = import.meta.glob<{ default: Component<AppProps> }>("./*/App.svelte", { eager: true });

for (const [path, module] of Object.entries(components)) {
  const id = path.split("/")[1];
  if (id) provideAppComponent(id, module.default);
}
