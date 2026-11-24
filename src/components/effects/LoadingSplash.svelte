<script lang="ts">
  import { prefersReducedMotion } from "@lib/motion";
  import { onMount } from "svelte";
  import OutrunScene from "./OutrunScene.svelte";

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
  class={["outrun-splash-root", leaving && "crt-power-off"]}
  data-sun-rise={sunRise ? "" : undefined}
  style:--splash-ms={`${durationMs}ms`}
>
  <OutrunScene gradientId="mountain-fade-splash" powerOnMs={Math.round(durationMs * 0.75)} />

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

<style>
  @keyframes caret-blink {
    0%,
    49% {
      opacity: 1;
    }
    50%,
    100% {
      opacity: 0;
    }
  }

  /* ---- cinematic loading splash (outrun) ---- */
  @keyframes outrun-glitch {
    0%,
    95% {
      transform: translate(0, 0);
      opacity: 0;
    }
    96% {
      transform: translate(-2px, 1px);
      opacity: 0.65;
    }
    97% {
      transform: translate(2px, -1px);
      opacity: 0.75;
    }
    98% {
      transform: translate(-1px, 1px);
      opacity: 0.45;
    }
    100% {
      transform: translate(0, 0);
      opacity: 0;
    }
  }
  @keyframes outrun-progress {
    from {
      transform: scaleX(0);
    }
    to {
      transform: scaleX(1);
    }
  }

  .outrun-splash-root {
    position: fixed;
    inset: 0;
    z-index: var(--z-boot);
    overflow: hidden;
    background: var(--boot-bg);
  }
  .splash-overlay {
    position: absolute;
    inset: 0;
    z-index: 6;
    pointer-events: none;
  }

  .outrun-content {
    position: relative;
    z-index: 8;
    min-height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    padding: 28px;
    pointer-events: none;
  }

  .outrun-brand {
    position: relative;
    margin: 0;
    font-family: var(--font-chrome);
    font-size: clamp(42px, 8vw, 92px);
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    background: linear-gradient(to right, var(--magenta), var(--cyan));
    background-clip: text;
    color: transparent;
    text-shadow:
      0 0 20px color-mix(in srgb, var(--magenta) 35%, transparent),
      0 0 34px color-mix(in srgb, var(--cyan) 35%, transparent);
  }

  .outrun-brand::before,
  .outrun-brand::after {
    content: attr(data-text);
    position: absolute;
    inset: 0;
    opacity: 0;
    pointer-events: none;
    animation: outrun-glitch 4s steps(1, end) infinite;
  }

  .outrun-brand::before {
    color: color-mix(in srgb, var(--magenta) 85%, transparent);
    clip-path: inset(0 0 50% 0);
  }

  .outrun-brand::after {
    color: color-mix(in srgb, var(--cyan) 85%, transparent);
    clip-path: inset(52% 0 0 0);
    animation-delay: 50ms;
  }

  .outrun-label {
    margin: 0;
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: var(--font-mono);
    font-size: var(--fs-18);
    letter-spacing: 0.09em;
    color: var(--boot-fg);
    text-shadow: 0 0 10px var(--boot-glow);
  }

  .outrun-caret {
    animation: caret-blink 1s steps(1, end) infinite;
  }

  .outrun-progress-track {
    width: min(66vw, 380px);
    height: 10px;
    border: 1px solid;
    border-color: var(--bevel-light) var(--bevel-dark) var(--bevel-dark) var(--bevel-light);
    background: var(--surface-deep);
    box-shadow: inset 1px 1px 0 color-mix(in srgb, var(--bevel-shadow) 75%, transparent);
    overflow: hidden;
  }

  .outrun-progress-fill {
    height: 100%;
    width: 100%;
    transform-origin: left center;
    transform: scaleX(0);
    background: linear-gradient(to right, var(--magenta), var(--cyan));
    box-shadow: 0 0 12px color-mix(in srgb, var(--cyan) 55%, transparent);
    animation: outrun-progress var(--splash-ms, 800ms) var(--ease-out) forwards;
  }

  .outrun-hint {
    margin: 0;
    font-family: var(--font-mono);
    font-size: var(--fs-14);
    letter-spacing: 0.08em;
    color: var(--boot-muted);
  }

  @media (max-width: 640px) {
    /* The scene's sun, smaller on a phone during the splash only. */
    .outrun-splash-root :global(.outrun-sun-wrap) {
      width: min(58vw, 280px);
      top: 24%;
    }

    .outrun-label {
      font-size: var(--fs-16);
      text-align: center;
    }

    .outrun-hint {
      font-size: var(--fs-13);
      text-align: center;
    }
  }
</style>
