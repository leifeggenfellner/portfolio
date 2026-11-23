<script lang="ts">
  import { tick } from "svelte";
  import type { AppArgs } from "@lib/app-shell";
  import { focusWindow } from "@lib/os/focus";
  import { getOs } from "@lib/os/context";
  import { bindingFor } from "@lib/os/shortcuts";
  import type { PaletteItem } from "@lib/palette";

  const { windows, launcher, keymap, boot, settings } = getOs();

  // Loaded on first use, like the apps, so the desktop's first paint doesn't carry it.
  let CommandPalette = $state<typeof import("./CommandPalette.svelte").default>();
  let isOpen = $state(false);
  // Bumped on every open. Reopening while the last palette is still fading
  // out would otherwise revive that one, with its old query and no focus.
  let session = $state(0);
  // Where focus was when the palette opened, to go back to when it closes.
  let returnFocus: HTMLElement | null = null;

  export async function open() {
    if (isOpen) return;
    CommandPalette ??= (await import("./CommandPalette.svelte")).default;
    const current = document.activeElement;
    returnFocus = current instanceof HTMLElement && current !== document.body ? current : null;
    session += 1;
    isOpen = true;
  }

  function close() {
    isOpen = false;
    const back = returnFocus;
    returnFocus = null;
    if (back?.isConnected) back.focus({ preventScroll: true });
  }

  /** Open (or bring forward) an app's window and put focus where it works. */
  async function launchAndFocus(appId: string, args?: AppArgs) {
    if (!(await launcher.open(appId, { args }))) return;
    await tick();
    focusWindow(windows, appId);
  }

  function run(item: PaletteItem) {
    const { action } = item;
    if (action.kind === "setting") {
      // Values come from that key's own schema options, so they fit.
      settings.set(action.key, action.value as never);
      close();
      return;
    }
    isOpen = false;
    returnFocus = null;
    void launchAndFocus(action.appId, action.args);
  }

  $effect(() =>
    keymap.bind({
      ...bindingFor("palette"),
      when: () => boot.phase === "desktop",
      run: () => (isOpen ? close() : void open()),
    }),
  );
</script>

{#if isOpen && CommandPalette}
  {#key session}
    <CommandPalette apps={launcher.apps} onRun={run} onClose={close} />
  {/key}
{/if}
