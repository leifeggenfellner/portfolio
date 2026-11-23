<script lang="ts">
  import type { Snippet } from "svelte";
  import AppCrash from "./AppCrash.svelte";

  interface Props {
    /** Names the app in the console and on its blue screen. */
    appId: string;
    title: string;
    onClose: () => void;
    children: Snippet;
  }

  let { appId, title, onClose, children }: Props = $props();
</script>

<!-- One boundary per window: a crashing app shows its blue screen and nothing else breaks. -->
<svelte:boundary onerror={(error) => console.error(`App "${appId}" crashed`, error)}>
  {@render children()}

  {#snippet failed(error, reset)}
    <AppCrash {title} {error} onRestart={reset} {onClose} />
  {/snippet}
</svelte:boundary>
