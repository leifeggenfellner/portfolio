<script lang="ts">
  import { tick } from "svelte";
  import { focusWindow } from "@lib/os/focus";
  import { getOs } from "@lib/os/context";
  import type { PaletteItem } from "@lib/palette";
  import { intents } from "@lib/store/intents";

  const { windows, launcher, keymap, boot, settings } = getOs();

  // Loaded on first use, like the apps, so the desktop's first paint doesn't carry it.
  let CommandPalette = $state<typeof import("./CommandPalette.svelte").default>();
  let isOpen = $state(false);
  // Bumped on every open. Reopening while the last palette is still fading
  // out would otherwise revive that one, with its old query and no focus.
  let session = $state(0);
  // Where focus was when the palette opened, to go back to when it closes.
  let returnFocus: HTMLElement | null = null;

  const apps = launcher.apps.map(({ id, title, icon }) => ({ id, title, icon }));

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
  async function launchAndFocus(appId: string) {
    if (!(await launcher.open(appId))) return;
    await tick();
    focusWindow(windows, appId);
  }

  function run(item: PaletteItem) {
    const { action } = item;
    if (action.kind === "setting") {
      if (action.key === "theme") settings.set("theme", action.value);
      else if (action.key === "crt") settings.set("crt", action.value);
      else settings.set("gridSpeed", action.value);
      close();
      return;
    }
    isOpen = false;
    returnFocus = null;
    if (action.kind === "app") void launchAndFocus(action.appId);
    else if (action.kind === "project") {
      intents.showProject(action.slug);
      void launchAndFocus("projects");
    } else {
      intents.runInTerminal(action.command);
      void launchAndFocus("terminal");
    }
  }

  $effect(() =>
    keymap.bind({
      id: "palette",
      keys: ["Mod+K", "Mod+Shift+K"],
      scope: "desktop",
      description: "Open or close the command palette",
      when: () => boot.phase === "desktop",
      run: () => (isOpen ? close() : void open()),
    }),
  );
</script>

{#if isOpen && CommandPalette}
  {#key session}
    <CommandPalette {apps} onRun={run} onClose={close} />
  {/key}
{/if}
