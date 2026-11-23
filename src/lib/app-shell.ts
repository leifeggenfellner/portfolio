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

/** A ready-made launch, listed in the command palette, e.g. a terminal command. */
export interface AppCommand {
  label: string;
  args: AppArgs;
}

export interface AppRoute {
  path: `/${string}/`;
  args: AppArgs;
  /** The page title, e.g. the project's name. */
  title: string;
  description?: string;
}

/** An app: what the desktop needs to list, open and route to it. Lives in `src/apps/<id>/manifest.ts`. */
export interface AppManifest {
  id: string;
  /** Position on the desktop, the Start menu and other app lists. */
  order: number;
  title: string;
  icon: string;
  /** Short name under the desktop icon; the title's first word if absent. */
  label?: string;
  /** The app's page, e.g. `/terminal/`: the desktop with this window open. */
  route: `/${string}/`;
  /** More pages that open the app with arguments, e.g. one per project. Async so its data stays out of the desktop's bundle. */
  routes?: () => Promise<readonly AppRoute[]>;
  defaults: { x: number; y: number; w: number; h: number };
  commands?: readonly AppCommand[];
  /** The app's component, loaded on first open so the desktop doesn't carry every app. */
  load: () => Promise<{ default: Component<AppProps> }>;
  /** Keep the arguments this app understands; anything else is dropped before launch. */
  parseArgs?: (raw: AppArgs) => AppArgs | undefined;
}
