<script lang="ts">
  import {
    horizonBudget,
    columnBases,
    columnSpacing,
    columnXAt,
    parseDuration,
    rowAlpha,
    rowDepths,
    rowWidth,
    rowY,
    withAlpha,
  } from "@lib/horizon";
  import { prefersReducedMotion } from "@lib/motion";
  import { onMount } from "svelte";

  interface Props {
    /** Draw the floor in from the horizon over this many ms (the boot "power on"). */
    powerOnMs?: number;
    /** Something covers the floor completely; stop drawing until it doesn't. */
    hidden?: boolean;
  }

  let { powerOnMs = 0, hidden = false }: Props = $props();

  let canvas = $state<HTMLCanvasElement>();
  let running = $state(false);
  let durationMs = $state(8000);

  const FALLBACK_LINE = "#1fb6d6";
  const FALLBACK_HAZE = "#e83fb0";
  const FALLBACK_FLOOR = "#2a1a4a";
  const PHASE_ATTR_INTERVAL_MS = 250;

  // Set once mounted; re-run whenever `hidden` changes.
  let restart: (() => void) | null = null;
  $effect(() => {
    void hidden;
    restart?.();
  });

  onMount(() => {
    const el = canvas;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let lineColor = FALLBACK_LINE;
    let hazeColor = FALLBACK_HAZE;
    let floorColor = FALLBACK_FLOOR;
    let preferredSpacing = 96;
    let raf = 0;
    let phase = 0;
    let lastTime = performance.now();
    let lastPhaseAttr = 0;
    let lastDraw = -Infinity;
    const budget = horizonBudget({
      coarsePointer: window.matchMedia("(pointer: coarse)").matches,
      cores: navigator.hardwareConcurrency,
    });
    const frameIntervalMs = 1000 / budget.fps;
    const powerStart = performance.now();
    const powerDuration = prefersReducedMotion() ? 0 : powerOnMs;

    function readTokens() {
      const styles = getComputedStyle(el!);
      lineColor = styles.getPropertyValue("--grid-line-base").trim() || FALLBACK_LINE;
      hazeColor = styles.getPropertyValue("--grid-haze-base").trim() || FALLBACK_HAZE;
      floorColor = styles.getPropertyValue("--desktop-bg").trim() || FALLBACK_FLOOR;
      preferredSpacing = Number.parseFloat(styles.getPropertyValue("--grid-column-step")) || 96;
      durationMs = parseDuration(styles.getPropertyValue("--grid-scroll-duration"), 8000);
    }

    function resize() {
      const rect = el!.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, budget.maxDpr);
      width = rect.width;
      height = rect.height;
      el!.width = Math.max(1, Math.round(width * dpr));
      el!.height = Math.max(1, Math.round(height * dpr));
    }

    function reveal(now: number): number {
      if (!powerDuration) return 1;
      const t = Math.min(1, (now - powerStart) / powerDuration);
      return 1 - (1 - t) ** 3;
    }

    function draw(now: number) {
      if (!width || !height) return;
      const limit = height * reveal(now);
      const vanishX = width / 2;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.clearRect(0, 0, width, height);

      // The floor is its own dark plane; the sky gradient must not show through it.
      ctx!.fillStyle = floorColor;
      ctx!.fillRect(0, 0, width, height);

      // Haze: a thin glow band sitting on the horizon, not a wash over the floor.
      const haze = ctx!.createLinearGradient(0, 0, 0, height * 0.22);
      haze.addColorStop(0, withAlpha(hazeColor, 0.5));
      haze.addColorStop(1, withAlpha(hazeColor, 0));
      ctx!.fillStyle = haze;
      ctx!.fillRect(0, 0, width, Math.min(limit, height * 0.22));

      // Columns fan out from the vanishing point but stay hidden in the haze,
      // where they would otherwise crowd into moiré.
      const fade = ctx!.createLinearGradient(0, 0, 0, height);
      fade.addColorStop(0, withAlpha(lineColor, 0));
      fade.addColorStop(0.12, withAlpha(lineColor, 0));
      fade.addColorStop(0.45, withAlpha(lineColor, 0.75));
      fade.addColorStop(1, withAlpha(lineColor, 1));
      ctx!.strokeStyle = fade;
      ctx!.lineWidth = 1.25;
      ctx!.beginPath();
      for (const base of columnBases(width, vanishX, columnSpacing(width, preferredSpacing))) {
        ctx!.moveTo(vanishX, 0);
        ctx!.lineTo(columnXAt(vanishX, base, limit, height), limit);
      }
      ctx!.stroke();

      // Rows: brighter and heavier toward the viewer, with a soft bloom pass.
      for (const depth of rowDepths(phase, height)) {
        const y = rowY(depth, height);
        if (y > limit || y > height + 4) continue;
        const alpha = rowAlpha(y, height);
        const lineWidth = rowWidth(y, height);
        if (y > height * 0.25) {
          ctx!.strokeStyle = withAlpha(lineColor, alpha * 0.14);
          ctx!.lineWidth = lineWidth * 4;
          ctx!.beginPath();
          ctx!.moveTo(0, y);
          ctx!.lineTo(width, y);
          ctx!.stroke();
        }
        ctx!.strokeStyle = withAlpha(lineColor, alpha);
        ctx!.lineWidth = lineWidth;
        ctx!.beginPath();
        ctx!.moveTo(0, y);
        ctx!.lineTo(width, y);
        ctx!.stroke();
      }
    }

    function shouldRun(): boolean {
      return (
        !hidden &&
        !document.hidden &&
        !prefersReducedMotion() &&
        document.documentElement.getAttribute("data-grid-speed") !== "paused"
      );
    }

    function frame(now: number) {
      phase = (phase + (now - lastTime) / durationMs) % 1;
      lastTime = now;
      // Half-rate budgets skip frames; the phase still follows the clock.
      // The 1ms slack keeps a 60Hz display at an even 30.
      if (now - lastDraw >= frameIntervalMs - 1) {
        draw(now);
        lastDraw = now;
      }
      if (now - lastPhaseAttr > PHASE_ATTR_INTERVAL_MS) {
        el!.dataset.phase = phase.toFixed(3);
        lastPhaseAttr = now;
      }
      const poweringOn = reveal(now) < 1;
      raf = running || poweringOn ? requestAnimationFrame(frame) : 0;
    }

    // Start or stop the loop; a stopped floor still gets one frame so it
    // reflects the current theme and size.
    function sync() {
      readTokens();
      running = shouldRun();
      lastTime = performance.now();
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(frame);
    }

    resize();
    sync();
    restart = sync;

    const resizeObserver = new ResizeObserver(() => {
      resize();
      if (!running) sync();
    });
    resizeObserver.observe(el);
    const attrObserver = new MutationObserver(sync);
    attrObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "data-grid-speed"],
    });
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    motion.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);

    return () => {
      restart = null;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      attrObserver.disconnect();
      motion.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  });
</script>

<canvas
  bind:this={canvas}
  class="horizon-canvas"
  aria-hidden="true"
  data-horizon=""
  data-running={running}
  data-duration-ms={durationMs}
></canvas>
