<script lang="ts">
  import OutrunScene from "./OutrunScene.svelte";

  interface Props {
    /** A window or the screensaver hides the wallpaper; its floor can stop. */
    covered?: boolean;
  }

  let { covered = false }: Props = $props();
</script>

<div class="wallpaper" aria-hidden="true">
  <OutrunScene gradientId="mountain-fade-desktop" hidden={covered} />
</div>

<style>
  /* ---- vaporwave wallpaper ---- */
  .wallpaper {
    position: absolute;
    inset: 0;
    /* Keep the scene's internal layers (floor z-index 3, horizon 4) inside the
       wallpaper, so they never paint over desktop content such as the note. */
    isolation: isolate;
    overflow: hidden;
    background: var(--desktop-bg);
  }
</style>
