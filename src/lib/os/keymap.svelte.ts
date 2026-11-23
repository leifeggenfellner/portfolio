/**
 * Every desktop-wide shortcut goes through here: one capture-phase keydown
 * listener dispatches to bindings by scope, so precedence is declared
 * instead of depending on which listener happened to register first.
 *
 * Scopes, highest first: modal > window > desktop > global. While any modal
 * binding is registered (the screensaver, a full-screen toy, the boot
 * overlay), lower scopes don't run at all; within a scope the newest binding
 * goes first. A binding that handles a key stops it there: default
 * prevented and propagation stopped, so it can't also type into a field.
 * Keys no binding handles carry on to the focused element as usual.
 */

import { untrack } from "svelte";
import type { ShortcutScope } from "./shortcuts";

export type KeyScope = ShortcutScope;

export interface KeyBinding {
  id: string;
  /** e.g. `Mod+K` (Ctrl, or Cmd on a Mac), `Alt+Shift+ArrowLeft`, `Escape`, or `*` for any key. */
  keys: readonly string[];
  scope: KeyScope;
  /** Shown in help and `man`; bindings without one are internal. */
  description?: string;
  /** Extra condition, e.g. "not while typing". */
  when?: (e: KeyboardEvent) => boolean;
  /** Return false to let the key carry on as if unbound. */
  run: (e: KeyboardEvent) => boolean | void;
}

const SCOPE_ORDER: readonly KeyScope[] = ["modal", "window", "desktop", "global"];

interface Chord {
  key: string;
  mod: boolean;
  ctrl: boolean;
  meta: boolean;
  alt: boolean;
  shift: boolean;
}

function parseChord(spec: string): Chord {
  // "+" as the key itself: "Mod++" splits into [..., "", ""].
  const parts = spec.endsWith("++") ? [...spec.slice(0, -2).split("+"), "+"] : spec.split("+");
  const key = parts.pop() ?? "";
  const has = (name: string) => parts.includes(name);
  return { key, mod: has("Mod"), ctrl: has("Ctrl"), meta: has("Meta"), alt: has("Alt"), shift: has("Shift") };
}

/** Whether a key event is the chord `spec`. */
export function matchesChord(e: KeyboardEvent, spec: string): boolean {
  if (spec === "*") return true;
  const chord = parseChord(spec);
  if (chord.key === " " ? e.key !== " " : e.key.toLowerCase() !== chord.key.toLowerCase()) return false;
  const ctrl = chord.ctrl || (chord.mod && !e.metaKey);
  const meta = chord.meta || (chord.mod && e.metaKey);
  return e.ctrlKey === ctrl && e.metaKey === meta && e.altKey === chord.alt && e.shiftKey === chord.shift;
}

/** True when focus is somewhere text goes, where plain keys and selection shortcuts belong to the field. */
export function inTextField(e: KeyboardEvent): boolean {
  const target = e.target;
  return target instanceof Element && Boolean(target.closest("input, textarea, select, [contenteditable]"));
}

export class Keymap {
  // Raw: bindings are compared by identity to unbind, and hold functions, not state.
  #bindings = $state.raw<KeyBinding[]>([]);

  /** Every binding, newest last. */
  get bindings(): readonly KeyBinding[] {
    return this.#bindings;
  }

  /** Bindings with a description, for help, the palette and `man`. */
  get documented(): readonly KeyBinding[] {
    return this.#bindings.filter((b) => b.description);
  }

  /** Register a binding; returns the function that removes it (handy as an effect's cleanup). */
  bind(binding: KeyBinding): () => void {
    // Untracked: bind runs inside effects, which must not come to depend on the list they change.
    untrack(() => (this.#bindings = [...this.#bindings, binding]));
    return () => untrack(() => (this.#bindings = this.#bindings.filter((b) => b !== binding)));
  }

  /** Dispatch one key press. Returns whether a binding handled it. */
  handle(e: KeyboardEvent): boolean {
    if (e.isComposing) return false;
    const modal = this.#bindings.some((b) => b.scope === "modal");
    for (const scope of modal ? (["modal"] as const) : SCOPE_ORDER) {
      for (const binding of [...this.#bindings].reverse()) {
        if (binding.scope !== scope || !binding.keys.some((k) => matchesChord(e, k))) continue;
        if (binding.when && !binding.when(e)) continue;
        if (binding.run(e) === false) continue;
        e.preventDefault();
        e.stopPropagation();
        return true;
      }
    }
    return false;
  }

  /** Start dispatching key presses on `target`; returns the function that stops. */
  listen(target: Window = window): () => void {
    const onKey = (e: KeyboardEvent) => void this.handle(e);
    target.addEventListener("keydown", onKey, { capture: true });
    return () => target.removeEventListener("keydown", onKey, { capture: true });
  }
}
