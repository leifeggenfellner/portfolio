import { describe, expect, it, vi } from "vitest";
import { Keymap, matchesChord } from "@lib/os/keymap.svelte";
import type { KeyScope } from "@lib/os/keymap.svelte";

const press = (key: string, init: KeyboardEventInit = {}) =>
  new KeyboardEvent("keydown", { key, cancelable: true, ...init });

describe("matchesChord", () => {
  it("matches Mod as Ctrl or Cmd and requires the exact modifiers", () => {
    expect(matchesChord(press("k", { ctrlKey: true }), "Mod+K")).toBe(true);
    expect(matchesChord(press("k", { metaKey: true }), "Mod+K")).toBe(true);
    expect(matchesChord(press("k"), "Mod+K")).toBe(false);
    expect(matchesChord(press("k", { ctrlKey: true, altKey: true }), "Mod+K")).toBe(false);
    expect(matchesChord(press("ArrowLeft", { altKey: true, shiftKey: true }), "Alt+Shift+ArrowLeft")).toBe(true);
    expect(matchesChord(press(" "), " ")).toBe(true);
  });
});

describe("Keymap", () => {
  function bindAll(keymap: Keymap, scopes: KeyScope[]) {
    const ran: string[] = [];
    for (const scope of scopes) keymap.bind({ id: scope, keys: ["x"], scope, run: () => void ran.push(scope) });
    return ran;
  }

  it("runs the highest scope first and stops the key there", () => {
    const keymap = new Keymap();
    const ran = bindAll(keymap, ["global", "desktop", "window"]);
    const e = press("x");
    expect(keymap.handle(e)).toBe(true);
    expect(ran).toEqual(["window"]);
    expect(e.defaultPrevented).toBe(true);
  });

  it("lets a key fall through when a guard fails or a binding declines it", () => {
    const keymap = new Keymap();
    const ran = bindAll(keymap, ["global"]);
    keymap.bind({
      id: "guarded",
      keys: ["x"],
      scope: "window",
      when: () => false,
      run: () => void ran.push("guarded"),
    });
    keymap.bind({ id: "declines", keys: ["x"], scope: "desktop", run: () => false });
    keymap.handle(press("x"));
    expect(ran).toEqual(["global"]);
  });

  it("blocks every lower scope while a modal binding is registered, and not after", () => {
    const keymap = new Keymap();
    const ran = bindAll(keymap, ["global", "window"]);
    const unbind = keymap.bind({ id: "modal", keys: ["Escape"], scope: "modal", run: () => void ran.push("modal") });
    const e = press("x");
    expect(keymap.handle(e)).toBe(false);
    expect(e.defaultPrevented).toBe(false);
    keymap.handle(press("Escape"));
    unbind();
    keymap.handle(press("x"));
    expect(ran).toEqual(["modal", "window"]);
  });

  it("gives the newest modal binding the key first", () => {
    const keymap = new Keymap();
    const first = vi.fn();
    const second = vi.fn();
    keymap.bind({ id: "a", keys: ["*"], scope: "modal", run: first });
    keymap.bind({ id: "b", keys: ["*"], scope: "modal", run: second });
    keymap.handle(press("q"));
    expect(second).toHaveBeenCalledOnce();
    expect(first).not.toHaveBeenCalled();
  });
});
