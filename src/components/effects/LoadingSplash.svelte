<script lang="ts">
  import { prefersReducedMotion } from "@lib/motion";
  import { onMount } from "svelte";
  import HorizonCanvas from "./HorizonCanvas.svelte";

  interface Props {
    label?: string;
    /** How long the splash holds before handing over to the desktop. */
    durationMs: number;
    /** Raise the sun from behind the mountains (first visit only). */
    sunRise?: boolean;
    /** Fading out over the desktop, which renders the same scene underneath. */
    leaving?: boolean;
    onDone?: () => void;
  }

  let { label = "Booting RetroOS", durationMs, sunRise = false, leaving = false, onDone }: Props = $props();

  onMount(() => {
    if (!onDone) return;
    const t = window.setTimeout(onDone, prefersReducedMotion() ? 300 : durationMs);
    return () => window.clearTimeout(t);
  });
</script>

<div
  role="status"
  aria-live="polite"
  aria-label={label}
  class="outrun-splash-root"
  data-sun-rise={sunRise ? "" : undefined}
  data-leaving={leaving ? "" : undefined}
  style:--splash-ms={`${durationMs}ms`}
>
  <div class="outrun-sky" aria-hidden="true"></div>
  <div class="outrun-sun-wrap" aria-hidden="true">
    <div class="outrun-sun-core"></div>
  </div>

  <svg class="outrun-mountains" aria-hidden="true" viewBox="0 0 1200 200" preserveAspectRatio="none">
    <defs>
      <linearGradient id="mountain-fade-splash" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" class="mountain-stop-top" />
        <stop offset="1" class="mountain-stop-base" />
      </linearGradient>
    </defs>
    <path
      fill="url(#mountain-fade-splash)"
      d="M0 170 L130 90 L250 160 L340 80 L470 165 L600 70 L760 175 L920 95 L1050 170 L1200 110 L1200 200 L0 200 Z"
    ></path>
  </svg>
  <HorizonCanvas powerOnMs={Math.round(durationMs * 0.75)} />
  <div class="outrun-horizon" aria-hidden="true"></div>

  <div class="splash-overlay crt-scanlines" aria-hidden="true"></div>
  <div class="splash-overlay crt-vignette" aria-hidden="true"></div>

  <div class="outrun-content">
    <h1 class="outrun-brand" data-text="RETRO//OS">RETRO//OS</h1>

    <p class="outrun-label">
      <span>{label}</span>
      <span class="outrun-caret" aria-hidden="true">▌</span>
    </p>

    <div class="outrun-progress-track" aria-hidden="true">
      <div class="outrun-progress-fill"></div>
    </div>

    <p class="outrun-hint">STAGE 02 // POWERING PHOSPHOR MATRIX</p>
  </div>
</div>
