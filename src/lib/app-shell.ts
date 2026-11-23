import type { Component } from "svelte";

/**
 * What an interactive app may ask of the desktop. The Desktop passes one of
 * these to every Svelte app, so apps can open each other or close their own
 * window without importing the shell layer.
 */
export interface AppShell {
  /** Every app the desktop can open. */
  apps: readonly { id: string; title: string; icon: string }[];
  open(appId: string, args?: AppArgs): void;
  /** Close the window this app is running in. */
  close(): void;
}

/**
 * What to show when an app opens, e.g. `{ project: "retro-os" }` or
 * `{ command: "neofetch" }`. Strings only, so the same arguments can come
 * from a URL. Each launch passes a new object, so an app that reacts to
 * `args` runs again even when the values repeat.
 */
export type AppArgs = Readonly<Record<string, string>>;

export interface AppProps {
  shell: AppShell;
  /** The arguments of the latest launch, already checked by the manifest's `parseArgs`. */
  args?: AppArgs;
}

interface AppCommon {
  id: string;
  /** Position on the desktop, the Start menu and other app lists. */
  order: number;
  title: string;
  icon: string;
  defaults: { x: number; y: number; w: number; h: number };
}

/** Static app — pre-rendered Astro HTML, injected via {@html}. Zero JS. */
export interface StaticApp extends AppCommon {
  kind: "static";
}

/** Interactive app — Svelte component, dynamic-imported on first open. */
export interface SvelteApp extends AppCommon {
  kind: "svelte";
  load: () => Promise<{ default: Component<AppProps> }>;
  /** Keep the arguments this app understands; anything else is dropped before launch. */
  parseArgs?: (raw: AppArgs) => AppArgs | undefined;
}

export type AppManifest = StaticApp | SvelteApp;
