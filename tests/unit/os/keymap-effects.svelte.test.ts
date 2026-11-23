import { flushSync } from "svelte";
import { expect, it } from "vitest";
import { Keymap } from "@lib/os/keymap.svelte";

// Regression: binding from an effect made the effect depend on the binding list it changes,
// which looped until Svelte gave up and no window would open.
it("can be bound and unbound from effects without re-running them", () => {
  const keymap = new Keymap();
  let runs = 0;
  let on = $state(true);
  const stop = $effect.root(() => {
    $effect(() => {
      runs++;
      if (on) return keymap.bind({ id: "x", keys: ["x"], scope: "modal", run: () => {} });
    });
  });
  flushSync();
  expect(keymap.bindings).toHaveLength(1);
  on = false;
  flushSync();
  expect(keymap.bindings).toHaveLength(0);
  expect(runs).toBe(2);
  stop();
});
