/**
 * One-shot requests from the shell to an app it is about to open, such as
 * "show this project" or "run this command". The app takes the request when
 * it is ready; taking clears it, so it runs once.
 */
import { get, writable } from "svelte/store";

export interface Intents {
  /** Slug of a project the explorer should show. */
  project: string | null;
  /** A command the Terminal should run. */
  terminal: string | null;
}

const store = writable<Intents>({ project: null, terminal: null });

export const intents = {
  subscribe: store.subscribe,
  showProject(slug: string) {
    store.update((s) => ({ ...s, project: slug }));
  },
  runInTerminal(command: string) {
    store.update((s) => ({ ...s, terminal: command }));
  },
  /** The pending request of this kind, if any, and clear it. */
  take<K extends keyof Intents>(key: K): Intents[K] {
    const value = get(store)[key];
    if (value !== null) store.update((s) => ({ ...s, [key]: null }));
    return value;
  },
};
