<script lang="ts">
  import { APP_VERSION, BUILD_DATE } from "@lib/build-info";
  import { getOs } from "@lib/os/context";

  const BADGE_CLASS = [
    "phone:hidden pointer-events-none absolute top-3.5 right-4 z-(--z-desktop)",
    "text-right text-white/85",
    "desktop-glow",
  ].join(" ");

  const { settings } = getOs();
</script>

<aside class={BADGE_CLASS} aria-label="System information">
  <p class="font-chrome text-[28px] leading-none tracking-[0.02em]">
    RETRO<span class="text-cyan">//OS</span>
  </p>
  <p class="font-mono mt-1 text-[13px] opacity-80">v{APP_VERSION} · {settings.current.theme.toUpperCase()}</p>
  <p class="font-mono text-[12px] opacity-70">build {BUILD_DATE}</p>
</aside>
