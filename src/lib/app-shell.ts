/**
 * What an interactive app may ask of the desktop. The Desktop passes one of
 * these to every Svelte app, so apps can open each other or close their own
 * window without importing the shell layer.
 */
export interface AppShell {
  /** Every app the desktop can open. */
  apps: readonly { id: string; title: string; icon: string }[];
  open(appId: string): void;
  /** Close the window this app is running in. */
  close(): void;
}

export interface AppProps {
  shell: AppShell;
}
