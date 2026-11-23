<script lang="ts">
  import HorizonCanvas from "./HorizonCanvas.svelte";

  interface Props {
    /** A window or the screensaver hides the wallpaper; its floor can stop. */
    covered?: boolean;
  }

  let { covered = false }: Props = $props();
</script>

<div class="wallpaper" aria-hidden="true">
  <div class="outrun-sky"></div>
  <div class="outrun-sun-wrap">
    <div class="outrun-sun-core"></div>
  </div>
  <svg class="outrun-mountains" viewBox="0 0 1200 200" preserveAspectRatio="none">
    <defs>
      <linearGradient id="mountain-fade-desktop" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" class="mountain-stop-top" />
        <stop offset="1" class="mountain-stop-base" />
      </linearGradient>
    </defs>
    <path
      fill="url(#mountain-fade-desktop)"
      d="M0 170 L130 90 L250 160 L340 80 L470 165 L600 70 L760 175 L920 95 L1050 170 L1200 110 L1200 200 L0 200 Z"
    ></path>
  </svg>
  <HorizonCanvas hidden={covered} />
  <div class="outrun-horizon"></div>
</div>
