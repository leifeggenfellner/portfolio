<script lang="ts">
  interface Props {
    label?: string;
  }

  let { label = "Booting RetroOS" }: Props = $props();
</script>

<div role="status" aria-live="polite" aria-label={label} class="outrun-splash-root">
  <div class="outrun-sky" aria-hidden="true"></div>
  <div class="outrun-sun-wrap" aria-hidden="true">
    <div class="outrun-sun-core"></div>
  </div>

  <svg class="outrun-mountains" aria-hidden="true" viewBox="0 0 1200 200" preserveAspectRatio="none">
    <path d="M0 170 L130 90 L250 160 L340 80 L470 165 L600 70 L760 175 L920 95 L1050 170 L1200 110 L1200 200 L0 200 Z"
    ></path>
  </svg>

  <div class="outrun-grid" aria-hidden="true"></div>
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

    <p class="outrun-hint">STAGE 01 // POWERING PHOSPHOR MATRIX</p>
  </div>
</div>
