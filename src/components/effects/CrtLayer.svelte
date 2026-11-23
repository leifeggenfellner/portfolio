<div class="crt-layer" aria-hidden="true">
  <div class="crt-scanlines"></div>
  <div class="crt-glow"></div>
  <div class="crt-noise"></div>
  <div class="crt-vignette"></div>
</div>

<style>
  @keyframes scan-roll {
    from {
      background-position-y: 0;
    }
    to {
      background-position-y: 6px;
    }
  }

  @keyframes flicker {
    0%,
    100% {
      opacity: 0.97;
    }
    50% {
      opacity: 1;
    }
  }

  /* ---- CRT effect layer ---- */
  .crt-layer {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: var(--z-crt);
    opacity: 0;
    transition: opacity var(--dur-3) var(--ease-out);
  }
  :global([data-crt="subtle"]) .crt-layer,
  :global([data-crt="full"]) .crt-layer {
    opacity: 1;
  }
  .crt-scanlines {
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      to bottom,
      var(--crt-scanline) 0,
      var(--crt-scanline) 1px,
      transparent 1px,
      transparent 3px
    );
    mix-blend-mode: multiply;
  }
  :global([data-crt="full"]) .crt-scanlines {
    animation: scan-roll 0.5s steps(3) infinite;
  }
  .crt-vignette {
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at center, transparent 55%, var(--crt-vignette) 100%);
  }
  :global([data-crt="subtle"]) .crt-vignette {
    opacity: 0.4;
  }
  .crt-glow {
    position: absolute;
    inset: 0;
    display: none;
  }
  :global([data-crt="full"]) .crt-glow {
    display: block;
    background: var(--crt-glow);
    animation: flicker 0.15s infinite;
  }
  .crt-noise {
    position: absolute;
    inset: -50%;
    display: none;
    opacity: 0.04;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  }
  :global([data-crt="full"]) .crt-noise {
    display: block;
  }
</style>
