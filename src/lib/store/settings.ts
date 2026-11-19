import { get, writable } from "svelte/store";
import { DEFAULT_SETTINGS, parseSettings, SETTINGS_STORAGE_KEY } from "@lib/settings";
import type { Settings } from "@lib/settings";
import type { Readable } from "svelte/store";

const store = writable<Settings>({ ...DEFAULT_SETTINGS });

function hasStorage(): boolean {
  if (typeof globalThis === "undefined") {
    return false;
  }

  try {
    return typeof globalThis.localStorage !== "undefined";
  } catch {
    return false;
  }
}

function hydrate(): void {
  if (!hasStorage()) {
    return;
  }

  try {
    const raw = globalThis.localStorage.getItem(SETTINGS_STORAGE_KEY);
    store.set(parseSettings(raw));
  } catch {
    // Storage access can fail in restricted browser contexts.
  }
}

function set<K extends keyof Settings>(key: K, value: Settings[K]): void {
  let next = get(store);

  store.update((current) => {
    next = { ...current, [key]: value };
    return next;
  });

  if (!hasStorage()) {
    return;
  }

  try {
    globalThis.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage access can fail in restricted browser contexts.
  }
}

function reset(): void {
  store.set({ ...DEFAULT_SETTINGS });

  if (!hasStorage()) {
    return;
  }

  try {
    globalThis.localStorage.removeItem(SETTINGS_STORAGE_KEY);
  } catch {
    // Storage access can fail in restricted browser contexts.
  }
}

export const settings: {
  subscribe: Readable<Settings>["subscribe"];
  get(): Settings;
  hydrate(): void;
  set<K extends keyof Settings>(key: K, value: Settings[K]): void;
  reset(): void;
} = {
  subscribe: store.subscribe,
  get: () => get(store),
  hydrate,
  set,
  reset,
};
