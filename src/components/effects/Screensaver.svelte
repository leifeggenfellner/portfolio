<script lang="ts">
  import { prefersReducedMotion } from "@lib/motion";
  import { onMount } from "svelte";
  import HorizonCanvas from "./HorizonCanvas.svelte";

  // The logo picks up the next colour each time it hits an edge.
  const COLORS = ["var(--magenta)", "var(--cyan)", "var(--accent)", "var(--face-fill)"];
  const SPEED_PX_PER_S = 110;

  let logo = $state<HTMLElement>();
  let colorIndex = $state(0);
  let still = $state(false);

  onMount(() => {
    const el = logo;
    if (!el) return;
    still = prefersReducedMotion();
    if (still) return;

    let x = Math.random() * Math.max(0, window.innerWidth - el.offsetWidth);
    let y = Math.random() * Math.max(0, window.innerHeight * 0.5 - el.offsetHeight);
    let dx = SPEED_PX_PER_S;
    let dy = SPEED_PX_PER_S * 0.7;
    let last = performance.now();
    let raf = requestAnimationFrame(function step(now) {
      // Clamp the step so a backgrounded tab doesn't send the logo through a wall.
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const maxX = window.innerWidth - el.offsetWidth;
      const maxY = window.innerHeight - el.offsetHeight;
      x += dx * dt;
      y += dy * dt;
      let bounced = false;
      if (x <= 0 || x >= maxX) {
        dx = x <= 0 ? Math.abs(dx) : -Math.abs(dx);
        x = Math.min(Math.max(x, 0), maxX);
        bounced = true;
      }
      if (y <= 0 || y >= maxY) {
        dy = y <= 0 ? Math.abs(dy) : -Math.abs(dy);
        y = Math.min(Math.max(y, 0), maxY);
        bounced = true;
      }
      if (bounced) colorIndex = (colorIndex + 1) % COLORS.length;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      raf = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(raf);
  });
</script>

<div class="screensaver" data-screensaver aria-hidden="true">
  <div class="outrun-sky"></div>
  <HorizonCanvas />
  <div class="outrun-horizon"></div>
  <p
    bind:this={logo}
    class={["screensaver-logo font-chrome", still && "screensaver-logo--still"]}
    style:color={COLORS[colorIndex]}
  >
    RETRO//OS
  </p>
  <p class="screensaver-hint font-mono">move the mouse or press any key</p>
</div>
