<script lang="ts">
  import { stopOnInput } from "@lib/stop-on-input";
  import { createPipes } from "@lib/terminal/pipes";
  import type { Dir, Piece } from "@lib/terminal/pipes";
  import { onMount } from "svelte";

  interface Props {
    /** Pipes growing at once. */
    count: number;
    /** Called when a key or click stops the pipes. */
    onDone: () => void;
  }

  let { count, onDone }: Props = $props();

  const CELL_PX = 14;
  const STEP_MS = 40;
  // Theme colours, read from the tokens; the terminal pane is dark in both themes.
  const COLOR_TOKENS = ["--magenta", "--cyan", "--terminal-fg", "--terminal-accent", "--face-fill", "--terminal-err"];

  let canvas = $state<HTMLCanvasElement>();

  onMount(() => {
    const el = canvas!;
    const ctx = el.getContext("2d");
    if (!ctx) {
      onDone();
      return;
    }
    const styles = getComputedStyle(el);
    const bg = styles.getPropertyValue("--terminal-bg").trim() || "#0a0618";
    const colors = COLOR_TOKENS.map((token) => styles.getPropertyValue(token).trim()).filter(Boolean);
    const palette = colors.length ? colors : ["#3cff9c"];

    let pipes = createPipes({ cols: 1, rows: 1, count, colors: palette.length, random: Math.random });
    function resize() {
      el.width = el.clientWidth;
      el.height = el.clientHeight;
      pipes = createPipes({
        cols: Math.max(1, Math.floor(el.width / CELL_PX)),
        rows: Math.max(1, Math.floor(el.height / CELL_PX)),
        count,
        colors: palette.length,
        random: Math.random,
      });
      clear();
    }

    function clear() {
      ctx!.fillStyle = bg;
      ctx!.fillRect(0, 0, el.width, el.height);
    }

    // Centre of a cell edge: up, right, down, left.
    const EDGE: Record<Dir, [number, number]> = { 0: [0, -0.5], 1: [0.5, 0], 2: [0, 0.5], 3: [-0.5, 0] };

    function draw(piece: Piece) {
      const cx = (piece.x + 0.5) * CELL_PX;
      const cy = (piece.y + 0.5) * CELL_PX;
      const [ax, ay] = EDGE[piece.enter];
      const [bx, by] = EDGE[piece.exit];
      ctx!.strokeStyle = palette[piece.color] ?? palette[0]!;
      ctx!.beginPath();
      ctx!.moveTo(cx + ax * CELL_PX, cy + ay * CELL_PX);
      ctx!.lineTo(cx, cy);
      ctx!.lineTo(cx + bx * CELL_PX, cy + by * CELL_PX);
      ctx!.stroke();
    }

    resize();
    ctx.lineWidth = Math.round(CELL_PX / 3);
    ctx.lineCap = "square";
    ctx.lineJoin = "miter";

    let raf = 0;
    let last = 0;
    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      if (now - last < STEP_MS) return;
      last = now;
      const { pieces, reset } = pipes.step();
      if (reset) clear();
      ctx!.lineWidth = Math.round(CELL_PX / 3);
      ctx!.lineCap = "square";
      pieces.forEach(draw);
    }
    raf = requestAnimationFrame(frame);

    // The key that stops the pipes is swallowed, so it doesn't also type into the prompt.
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

<canvas bind:this={canvas} class="absolute inset-0 h-full w-full" aria-hidden="true" data-pipes></canvas>
