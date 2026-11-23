<script lang="ts">
  import Icon from "@primitives/Icon.svelte";
  import { cx } from "@lib/cx";
  import { durationMs, prefersReducedMotion } from "@lib/motion";
  import { SHORTCUTS } from "@lib/os/shortcuts";
  import { expoOut } from "svelte/easing";
  import type { TransitionConfig } from "svelte/transition";

  interface Props {
    mobile?: boolean;
    onDismiss: () => void;
  }

  let { mobile = false, onDismiss }: Props = $props();

  let noteEl = $state<HTMLElement>();

  /** Lets the shell move focus here when the note is reopened from the Start menu. */
  export function focus() {
    noteEl?.focus();
  }

  const KEY_CLASS = "bevel-out-thin bg-surface text-text font-mono text-[length:var(--fs-15)] px-1 leading-none";

  function noteOut(_node: Element): TransitionConfig {
    if (prefersReducedMotion()) return { duration: 0 };
    return {
      duration: durationMs("--dur-2", 160),
      easing: expoOut,
      css: (t) => `transform: rotate(-1.5deg) scale(${0.96 + 0.04 * t}); opacity: ${t};`,
    };
  }
</script>

<aside
  bind:this={noteEl}
  aria-labelledby="help-note-title"
  tabindex="-1"
  class={cx(
    "focus-ring absolute z-(--z-desktop) rotate-[-1.5deg] border border-(--note-edge) bg-(--note-bg) p-4 pt-5 text-(--note-text) shadow-[var(--note-shadow)] [--focus-ring-color:var(--note-text)]",
    mobile ? "right-4 bottom-[calc(var(--taskbar-height)+16px)] left-4" : "top-28 right-8 w-68",
  )}
  out:noteOut
>
  <span
    aria-hidden="true"
    class="absolute -top-2.5 left-1/2 h-5 w-20 -translate-x-1/2 rotate-[3deg] border border-(--note-edge) bg-(--note-tape)"
  ></span>

  <h2 id="help-note-title" class="font-chrome text-18 m-0 leading-none">read me</h2>
  <ul class="text-14 m-0 mt-3 flex list-none flex-col gap-2 p-0 leading-snug">
    {#if mobile}
      <li>Tap an icon to open it.</li>
      <li>The taskbar switches between open windows.</li>
    {:else}
      <li>Double-click an icon, or press <kbd class={KEY_CLASS}>Enter</kbd>, to open it.</li>
      <li>Right-click the desktop for more.</li>
      <li>The taskbar brings back anything you minimise.</li>
      <li>Drag a window to a screen edge to snap it.</li>
      <li><kbd class={KEY_CLASS}>{SHORTCUTS.closeWindow.label}</kbd> skips the boot and closes windows.</li>
      <li><kbd class={KEY_CLASS}>{SHORTCUTS.palette.label}</kbd> finds anything.</li>
      <li>The Terminal's <kbd class={KEY_CLASS}>man keys</kbd> lists every shortcut.</li>
    {/if}
  </ul>

  <button
    type="button"
    aria-label="Dismiss note"
    class="focus-ring absolute top-1 right-1 flex h-7 w-7 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-(--note-text)"
    onclick={onDismiss}
  >
    <Icon icon="pixelarticons:close" />
  </button>
</aside>
