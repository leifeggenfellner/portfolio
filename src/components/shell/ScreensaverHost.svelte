<script lang="ts">
  import Screensaver from "@effects/Screensaver.svelte";
  import { isDrafting, watchIdle } from "@lib/idle";
  import { getOs } from "@lib/os/context";
  import { screensaverDelayMs } from "@lib/settings";

  interface Props {
    /** Whether the screensaver is showing; the desktop pauses its wallpaper meanwhile. */
    on?: boolean;
  }

  let { on = $bindable(false) }: Props = $props();

  const { settings, keymap, boot } = getOs();

  // Only on the desktop, and never over a half-written draft.
  $effect(() => {
    const timeoutMs = screensaverDelayMs(settings.current.screensaver);
    if (timeoutMs === null || boot.phase !== "desktop") return;
    const stop = watchIdle({
      timeoutMs,
      onIdle: () => (on = true),
      onActive: () => (on = false),
      canIdle: () => !isDrafting(),
    });
    return () => {
      stop();
      on = false;
    };
  });

  // The key that wakes the screen is swallowed, as on a real machine, so it
  // can't also close a window or type into the terminal.
  $effect(() => {
    if (on) return keymap.bind({ id: "screensaver", keys: ["*"], scope: "modal", run: () => {} });
  });
</script>

{#if on}
  <Screensaver />
{/if}
