<script lang="ts">
  import HorizonCanvas from "./HorizonCanvas.svelte";
</script>

<div class="wallpaper" aria-hidden="true">
  <div class="outrun-sky"></div>
  <div class="outrun-sun-wrap">
    <div class="outrun-sun-core"></div>
  </div>
  <svg class="outrun-mountains" viewBox="0 0 1200 200" preserveAspectRatio="none">
    <path d="M0 170 L130 90 L250 160 L340 80 L470 165 L600 70 L760 175 L920 95 L1050 170 L1200 110 L1200 200 L0 200 Z"
    ></path>
  </svg>
  <HorizonCanvas />
  <div class="outrun-horizon"></div>
</div>
