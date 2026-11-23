<script lang="ts">
  // The synthwave scene shared by the desktop wallpaper and the boot splash:
  // sky, sun, mountains, the grid floor and the horizon glow.
  import HorizonCanvas from "./HorizonCanvas.svelte";

  interface Props {
    /** Unique per instance: two scenes can be on screen while the splash dissolves. */
    gradientId: string;
    /** The floor can stop while the scene is covered. */
    hidden?: boolean;
    /** The floor's power-on, during the splash. */
    powerOnMs?: number;
  }

  let { gradientId, hidden = false, powerOnMs }: Props = $props();
</script>

<div class="outrun-sky" aria-hidden="true"></div>
<div class="outrun-sun-wrap" aria-hidden="true">
  <div class="outrun-sun-core"></div>
</div>
<svg class="outrun-mountains" aria-hidden="true" viewBox="0 0 1200 200" preserveAspectRatio="none">
  <defs>
    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" class="mountain-stop-top" />
      <stop offset="1" class="mountain-stop-base" />
    </linearGradient>
  </defs>
  <path
    fill="url(#{gradientId})"
    d="M0 170 L130 90 L250 160 L340 80 L470 165 L600 70 L760 175 L920 95 L1050 170 L1200 110 L1200 200 L0 200 Z"
  ></path>
</svg>
<HorizonCanvas {hidden} {powerOnMs} />
<div class="outrun-horizon" aria-hidden="true"></div>

<style>
  @keyframes outrun-sun-pulse {
    from {
      opacity: 0.7;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes outrun-sun-rise {
    from {
      transform: translate(-50%, 55%);
    }
    to {
      transform: translate(-50%, 0);
    }
  }

  .outrun-sky {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 50% 18%, color-mix(in srgb, var(--cyan) 30%, transparent) 0%, transparent 38%),
      linear-gradient(
        to bottom,
        color-mix(in srgb, var(--desktop-bg) 80%, var(--shade) 20%) 0%,
        color-mix(in srgb, var(--magenta) 58%, var(--desktop-bg) 42%) 45%,
        color-mix(in srgb, var(--cyan) 38%, var(--magenta) 62%) 72%,
        color-mix(in srgb, var(--desktop-bg) 74%, var(--shade) 26%) 100%
      );
  }

  .outrun-sun-wrap {
    position: absolute;
    left: 50%;
    top: 20%;
    width: min(44vw, 400px);
    aspect-ratio: 1;
    transform: translateX(-50%);
  }

  .outrun-sun-core {
    width: 100%;
    height: 100%;
    border-radius: 9999px;
    background: repeating-linear-gradient(to bottom, var(--sun-face) 0 14px, var(--sun-band) 14px 20px);
    mask-image: linear-gradient(to bottom, #000 0%, #000 56%, transparent 88%);
  }

  /* First visit: the sun climbs out from behind the mountains. */
  :global([data-sun-rise]) .outrun-sun-wrap {
    animation: outrun-sun-rise var(--splash-ms) var(--ease-in-out) both;
  }

  /* The glow is painted once on its own layer; only its opacity pulses, so the
     sun never repaints per frame. */
  .outrun-sun-wrap::before {
    content: "";
    position: absolute;
    inset: -18%;
    z-index: -1;
    border-radius: 50%;
    background: radial-gradient(
      circle,
      color-mix(in srgb, var(--magenta) 55%, transparent) 0%,
      color-mix(in srgb, var(--cyan) 22%, transparent) 45%,
      transparent 70%
    );
    animation: outrun-sun-pulse 2.6s ease-in-out infinite alternate;
    pointer-events: none;
  }

  .outrun-mountains {
    position: absolute;
    left: 0;
    pointer-events: none;
    right: 0;
    bottom: var(--grid-horizon-bottom);
    width: 100%;
    height: min(25vh, 220px);
    z-index: 2;
  }
  /* Fill comes from the SVG's own gradient; its stops read these tokens. */
  .outrun-mountains path {
    stroke: var(--mountain-ridge);
    stroke-width: 2;
  }

  .mountain-stop-top {
    stop-color: var(--mountain-top);
  }

  .mountain-stop-base {
    stop-color: var(--mountain-base);
  }

  .outrun-horizon {
    position: absolute;
    left: 0;
    right: 0;
    bottom: var(--grid-horizon-bottom);
    height: 1px;
    z-index: 4;
    pointer-events: none;
    background: linear-gradient(
      to right,
      transparent 0%,
      color-mix(in srgb, var(--cyan) 85%, transparent) 28%,
      color-mix(in srgb, var(--magenta) 85%, transparent) 72%,
      transparent 100%
    );
    box-shadow: var(--grid-horizon-shadow);
  }
  :global([data-theme="dark"]) .outrun-horizon {
    background: linear-gradient(
      to right,
      transparent 0%,
      color-mix(in srgb, var(--magenta) 90%, transparent) 28%,
      color-mix(in srgb, var(--cyan) 90%, transparent) 72%,
      transparent 100%
    );
  }
</style>
