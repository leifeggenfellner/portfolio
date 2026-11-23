/**
 * The user's settings as reactive state, persisted to localStorage.
 * Storage can be missing or throw (private mode, quota, blocked site data);
 * settings then still work for the visit, they just aren't remembered.
 */
import { DEFAULT_SETTINGS, parseSettings, SETTINGS_STORAGE_KEY } from "@lib/settings";
import type { Settings } from "@lib/settings";

function storage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export class SettingsService {
  #values = $state<Settings>({ ...DEFAULT_SETTINGS });

  get current(): Readonly<Settings> {
    return this.#values;
  }

  /** Load stored settings. Called after mount, so server and first client render agree. */
  hydrate(): void {
    try {
      const raw = storage()?.getItem(SETTINGS_STORAGE_KEY);
      if (raw !== undefined) this.#values = parseSettings(raw);
    } catch {
      // Unreadable storage keeps the defaults.
    }
  }

  set<K extends keyof Settings>(key: K, value: Settings[K]): void {
    this.#values[key] = value;
    try {
      storage()?.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(this.#values));
    } catch {
      // Not remembered, but still applied for this visit.
    }
  }

  reset(): void {
    this.#values = { ...DEFAULT_SETTINGS };
    try {
      storage()?.removeItem(SETTINGS_STORAGE_KEY);
    } catch {
      // Nothing stored to clear.
    }
  }
}
