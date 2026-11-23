/**
 * App components that are already loaded, by app id. Normally an app's code
 * arrives on first open; a page that opens with a window (an app route)
 * needs that app's component before the first render, on the server and
 * before hydration, so it is provided here ahead of time.
 */
import type { AppProps } from "@lib/app-shell";
import type { Component } from "svelte";

const loaded = new Map<string, Component<AppProps>>();

export function provideAppComponent(appId: string, component: Component<AppProps>): void {
  loaded.set(appId, component);
}

export function loadedAppComponent(appId: string): Component<AppProps> | undefined {
  return loaded.get(appId);
}
