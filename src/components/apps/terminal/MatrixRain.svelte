<script lang="ts">
  import { stopOnInput } from "@lib/stop-on-input";
  import { onMount } from "svelte";

  interface Props {
    /** Called when a key or click stops the rain. */
    onDone: () => void;
  }

  let { onDone }: Props = $props();

  // Half-width katakana and digits, as on the phosphor screens it imitates.
  const GLYPHS = "ｦｱｳｴｵｶｷｹｺｻｼｽｾｿﾀﾂﾃﾅﾆﾇﾈﾊﾋﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾜ0123456789";
  const CELL_PX = 16;
  const FRAME_MS = 50;

  let canvas = $state<HTMLCanvasElement>();

  onMount(() => {
    const el = canvas!;
    const ctx = el.getContext("2d");
    if (!ctx) {
      onDone();
      return;
    }
    const styles = getComputedStyle(el);
    const fg = styles.getPropertyValue("--terminal-fg").trim() || "#3cff9c";
    const bg = styles.getPropertyValue("--terminal-bg").trim() || "#0a0618";
    const font = styles.getPropertyValue("--font-mono").trim() || "monospace";

    let drops: number[] = [];
    function resize() {
      el.width = el.clientWidth;
      el.height = el.clientHeight;
      drops = Array.from({ length: Math.ceil(el.width / CELL_PX) }, () => Math.floor(Math.random() * -20));
      ctx!.fillStyle = bg;
      ctx!.fillRect(0, 0, el.width, el.height);
    }
    resize();

    let raf = 0;
    let last = 0;
    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      if (now - last < FRAME_MS) return;
      last = now;
      // A translucent wash over the last frame leaves the fading trails.
      ctx!.globalAlpha = 0.12;
      ctx!.fillStyle = bg;
      ctx!.fillRect(0, 0, el.width, el.height);
      ctx!.globalAlpha = 1;
      ctx!.fillStyle = fg;
      ctx!.font = `${CELL_PX}px ${font}`;
      drops.forEach((row, col) => {
        const glyph = GLYPHS[Math.floor(Math.random() * GLYPHS.length)]!;
        ctx!.fillText(glyph, col * CELL_PX, row * CELL_PX);
        drops[col] = row * CELL_PX > el.height && Math.random() > 0.96 ? 0 : row + 1;
      });
    }
    raf = requestAnimationFrame(frame);

    // The key that stops the rain is swallowed, so it doesn't also type into the prompt.
    const stopListening = stopOnInput(onDone);
    const observer = new ResizeObserver(resize);
    observer.observe(el);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      stopListening();
    };
  });
</script>

<canvas bind:this={canvas} class="absolute inset-0 h-full w-full" aria-hidden="true" data-matrix></canvas>
