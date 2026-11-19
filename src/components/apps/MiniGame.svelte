<script lang="ts">
  import type { AppProps } from "@lib/app-shell";
  import { cx } from "@lib/cx";
  import { BEGINNER, chord, minesLeft, newGame, reveal, toggleFlag } from "@lib/minesweeper";
  import type { Cell, Game } from "@lib/minesweeper";
  import PixelArt from "@primitives/PixelArt.svelte";
  import RetroButton from "@primitives/RetroButton.svelte";
  import { CROSS, FACES, FLAG, MINE } from "./minesweeper/sprites";

  // Minesweeper needs nothing from the shell.
  let { shell: _shell }: AppProps = $props();

  const BEST_KEY = "retro-os:minesweeper-best";
  const { rows, cols, mines } = BEGINNER;

  const MINE_PALETTE = { "#": "var(--text)", w: "var(--surface-3)" };
  const FLAG_PALETTE = { r: "var(--err)", "#": "var(--text)" };
  const CROSS_PALETTE = { x: "var(--err)" };
  const FACE_PALETTE = { y: "var(--face-fill)", "#": "var(--face-ink)" };
  const NUMBER_CLASS = [
    "",
    "text-(--mine-1)",
    "text-(--mine-2)",
    "text-(--mine-3)",
    "text-(--mine-4)",
    "text-(--mine-5)",
    "text-(--mine-6)",
    "text-(--mine-7)",
    "text-(--mine-8)",
  ];

  let game = $state<Game>(newGame(rows, cols, mines));
  let focusIndex = $state(Math.floor((rows * cols) / 2));
  let pressing = $state(false);
  let flagMode = $state(false);
  let startedAt = 0;
  let seconds = $state(0);
  let best = $state<number | null>(readBest());
  let gridEl = $state<HTMLElement>();

  const face = $derived(
    game.status === "won" ? FACES.won : game.status === "lost" ? FACES.lost : pressing ? FACES.pressing : FACES.ready,
  );

  const status = $derived.by(() => {
    if (game.status === "won") return `Cleared in ${seconds} s.${best === seconds ? " New best!" : ""}`;
    if (game.status === "lost") return "Boom. Press the face to play again.";
    if (game.status === "ready") return "Open any square. Right-click or F flags.";
    return best === null ? "No best time yet." : `Best: ${best} s.`;
  });

  function readBest(): number | null {
    try {
      const value = Number(localStorage.getItem(BEST_KEY));
      return value > 0 ? value : null;
    } catch {
      return null;
    }
  }

  function saveBest(time: number) {
    if (best !== null && best <= time) return;
    best = time;
    try {
      localStorage.setItem(BEST_KEY, String(time));
    } catch {
      // Storage can be unavailable; the best time just won't persist.
    }
  }

  function led(value: number): string {
    const clamped = Math.max(-99, Math.min(999, value));
    return clamped < 0 ? `-${String(-clamped).padStart(2, "0")}` : String(clamped).padStart(3, "0");
  }

  function apply(next: Game) {
    if (next === game) return;
    if (game.status === "ready" && next.status !== "ready") {
      startedAt = Date.now();
      seconds = 0;
    }
    game = next;
    if (next.status === "won") {
      seconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
      saveBest(seconds);
    }
  }

  function restart() {
    game = newGame(rows, cols, mines);
    seconds = 0;
    pressing = false;
  }

  function act(index: number) {
    focusIndex = index;
    const cell = game.cells[index];
    if (!cell) return;
    if (flagMode && cell.state !== "revealed") apply(toggleFlag(game, index));
    else if (cell.state === "revealed") apply(chord(game, index));
    else apply(reveal(game, index));
  }

  function flag(index: number) {
    focusIndex = index;
    apply(toggleFlag(game, index));
  }

  function moveFocus(index: number) {
    focusIndex = index;
    gridEl?.querySelector<HTMLButtonElement>(`[data-cell="${index}"]`)?.focus();
  }

  function handleGridKeydown(e: KeyboardEvent) {
    const row = Math.floor(focusIndex / cols);
    const col = focusIndex % cols;
    const moves: Record<string, number> = {
      ArrowUp: Math.max(0, row - 1) * cols + col,
      ArrowDown: Math.min(rows - 1, row + 1) * cols + col,
      ArrowLeft: row * cols + Math.max(0, col - 1),
      ArrowRight: row * cols + Math.min(cols - 1, col + 1),
      Home: row * cols,
      End: row * cols + cols - 1,
    };
    const target = moves[e.key];
    if (target !== undefined) {
      e.preventDefault();
      moveFocus(target);
    } else if (e.key.toLowerCase() === "f") {
      e.preventDefault();
      flag(focusIndex);
    } else if (e.key === "F2" || e.key.toLowerCase() === "n") {
      e.preventDefault();
      restart();
    }
  }

  function cellLabel(cell: Cell, index: number): string {
    const where = `Row ${Math.floor(index / cols) + 1}, column ${(index % cols) + 1}`;
    let what: string;
    if (cell.state === "flagged") what = game.status === "lost" && !cell.mine ? "wrong flag" : "flagged";
    else if (cell.state === "hidden") what = "hidden";
    else if (cell.mine) what = index === game.exploded ? "mine, exploded" : "mine";
    else what = cell.adjacent ? `${cell.adjacent} ${cell.adjacent === 1 ? "mine" : "mines"} nearby` : "empty";
    return `${where}: ${what}`;
  }

  $effect(() => {
    if (game.status !== "playing") return;
    const id = window.setInterval(() => {
      seconds = Math.min(999, Math.floor((Date.now() - startedAt) / 1000));
    }, 250);
    return () => window.clearInterval(id);
  });

  const CELL_BASE =
    "focus-ring no-select font-chrome text-16 grid h-(--cell) w-(--cell) place-items-center leading-none font-bold";
  const CELL_HIDDEN = "bevel-out bg-surface hover:bg-surface-2 cursor-pointer";
  const CELL_OPEN = "border-bevel-shadow border-r border-b cursor-default";
  const LED_CLASS =
    "bevel-in-thin bg-led-bg text-led-fg font-mono text-32 relative px-1.5 leading-none tabular-nums [text-shadow:0_0_6px_var(--led-ghost)]";
</script>

<div
  class="text-text grid h-full place-items-center overflow-auto p-3 [--cell:28px] max-md:[--cell:min(36px,calc((100vw-56px)/9))]"
>
  <div class="grid w-max gap-3">
    <div class="bevel-in bg-surface flex items-center justify-between gap-4 p-2">
      <span class={LED_CLASS} role="status" aria-label={`${minesLeft(game)} mines left`}>
        <span class="absolute inset-x-1.5 text-(--led-ghost)" aria-hidden="true">888</span>
        <span class="relative" aria-hidden="true">{led(minesLeft(game))}</span>
      </span>
      <button
        type="button"
        class={cx("focus-ring bg-surface grid h-11 w-11 place-items-center", pressing ? "bevel-pressed" : "bevel-out")}
        aria-label="New game"
        onclick={restart}
      >
        <PixelArt rows={face} palette={FACE_PALETTE} size={32} />
      </button>
      <span class={LED_CLASS} aria-label={`${seconds} seconds`} role="timer">
        <span class="absolute inset-x-1.5 text-(--led-ghost)" aria-hidden="true">888</span>
        <span class="relative" aria-hidden="true">{led(seconds)}</span>
      </span>
    </div>

    <div
      bind:this={gridEl}
      role="grid"
      aria-label="Minefield"
      aria-rowcount={rows}
      aria-colcount={cols}
      tabindex="-1"
      class="bevel-in bg-surface-2 grid p-0.75"
      style:grid-template-columns={`repeat(${cols}, var(--cell))`}
      onkeydown={handleGridKeydown}
      onpointerup={() => (pressing = false)}
      onpointerleave={() => (pressing = false)}
    >
      {#each Array.from({ length: rows }, (_, r) => r) as r (r)}
        <div role="row" class="contents">
          {#each game.cells.slice(r * cols, r * cols + cols) as cell, c (c)}
            {@const index = r * cols + c}
            {@const open = cell.state === "revealed"}
            {@const wrongFlag = game.status === "lost" && cell.state === "flagged" && !cell.mine}
            <div role="gridcell" class="contents">
              <button
                type="button"
                data-cell={index}
                tabindex={index === focusIndex ? 0 : -1}
                aria-label={cellLabel(cell, index)}
                class={cx(
                  CELL_BASE,
                  open || wrongFlag ? CELL_OPEN : CELL_HIDDEN,
                  (open || wrongFlag) && (index === game.exploded ? "bg-err" : "bg-surface-2"),
                  open && !cell.mine && NUMBER_CLASS[cell.adjacent],
                )}
                onclick={() => act(index)}
                oncontextmenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  flag(index);
                }}
                onauxclick={(e) => {
                  if (e.button === 1) apply(chord(game, index));
                }}
                onpointerdown={(e) => {
                  if (e.button === 0 && !open && game.status !== "won" && game.status !== "lost") pressing = true;
                }}
                onfocus={() => (focusIndex = index)}
              >
                {#if wrongFlag}
                  <span class="relative grid place-items-center">
                    <PixelArt rows={MINE} palette={MINE_PALETTE} size={24} />
                    <PixelArt rows={CROSS} palette={CROSS_PALETTE} size={24} class="absolute" />
                  </span>
                {:else if cell.state === "flagged"}
                  <PixelArt rows={FLAG} palette={FLAG_PALETTE} size={24} />
                {:else if open && cell.mine}
                  <PixelArt rows={MINE} palette={MINE_PALETTE} size={24} />
                {:else if open && cell.adjacent}
                  {cell.adjacent}
                {/if}
              </button>
            </div>
          {/each}
        </div>
      {/each}
    </div>

    <!-- w-0 min-w-full: as wide as the board, never wider. -->
    <div class="flex w-0 min-w-full flex-wrap items-center justify-between gap-2">
      <p class="text-13 text-text-dim" aria-live="polite">{status}</p>
      <RetroButton size="sm" active={flagMode} onclick={() => (flagMode = !flagMode)}>
        <PixelArt rows={FLAG} palette={FLAG_PALETTE} size={12} />
        Flag mode
      </RetroButton>
    </div>
  </div>
</div>
