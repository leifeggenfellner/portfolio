<script lang="ts">
  import Screensaver from "@effects/Screensaver.svelte";
  import { isDrafting, watchIdle } from "@lib/idle";
  import { durationMs, prefersReducedMotion } from "@lib/motion";
  import { getOs } from "@lib/os/context";
  import { screensaverDelayMs } from "@lib/settings";

  interface Props {
    /** Whether the screensaver is showing; the desktop pauses its wallpaper meanwhile. */
    on?: boolean;
  }

  let { on = $bindable(false) }: Props = $props();

  const { settings, keymap, boot, viewport } = getOs();

  // Only on the desktop, never on a phone (kept light there), and never over a half-written draft.
  $effect(() => {
    const timeoutMs = screensaverDelayMs(settings.current.screensaver);
    if (timeoutMs === null || boot.phase !== "desktop" || viewport.mobile) return;
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

  // On wake the screensaver switches off like a tube, then goes; the desktop
  // is already live underneath. Removed on a timer, whatever the animation does.
  let shown = $state(false);
  let leaving = $state(false);
  $effect(() => {
    if (on) {
      shown = true;
      leaving = false;
      return;
    }
    if (!shown) return;
    if (prefersReducedMotion()) {
      shown = false;
      return;
    }
    leaving = true;
    const t = setTimeout(
      () => {
        shown = false;
        leaving = false;
      },
      durationMs("--dur-crt-off", 420),
    );
    return () => clearTimeout(t);
  });

  // The key that wakes the screen is swallowed, as on a real machine, so it
  // can't also close a window or type into the terminal.
  $effect(() => {
    if (on) return keymap.bind({ id: "screensaver", keys: ["*"], scope: "modal", run: () => {} });
  });
</script>

{#if shown}
  <Screensaver {leaving} />
{/if}
