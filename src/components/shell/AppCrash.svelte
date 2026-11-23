<script lang="ts">
  import RetroButton from "@primitives/RetroButton.svelte";
  import { onMount } from "svelte";

  interface Props {
    /** The crashed app's window title. */
    title: string;
    error: unknown;
    onRestart: () => void;
    onClose: () => void;
  }

  let { title, error, onRestart, onClose }: Props = $props();

  const errorName = $derived(error instanceof Error ? error.name : "UnknownError");
  const errorMessage = $derived(error instanceof Error ? error.message : String(error));

  let screen = $state<HTMLElement>();

  // The crash took whatever was focused in the window with it. Hand the
  // keyboard to Restart, but only if focus was in this window or lost.
  onMount(() => {
    const win = screen?.closest<HTMLElement>("[data-window-id]");
    const active = document.activeElement;
    if (!active || active === document.body || win?.contains(active)) {
      screen?.querySelector<HTMLElement>("[data-autofocus]")?.focus({ preventScroll: true });
    }
  });
</script>

<section
  bind:this={screen}
  role="alert"
  aria-labelledby="crash-title"
  class="bg-crash-bg text-crash-fg font-mono text-18 flex h-full min-h-0 flex-col gap-4 overflow-y-auto p-5 leading-tight [--focus-ring-color:var(--crash-fg)]"
>
  <h2 id="crash-title" class="bg-crash-fg text-crash-bg self-center px-2">{title}</h2>
  <p>A fatal exception <strong>{errorName}</strong> has occurred in this app.</p>
  <p class="opacity-80">{errorMessage}</p>
  <p>The rest of the desktop is fine. Restart the app, or close its window.</p>
  <div class="mt-auto flex flex-wrap gap-2">
    <RetroButton variant="primary" data-autofocus onclick={onRestart}>Restart app</RetroButton>
    <RetroButton onclick={onClose}>Close</RetroButton>
  </div>
</section>
