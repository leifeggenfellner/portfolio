<script lang="ts">
  import { bar, formatBytes, leader, overallPercent, STATUS_TEXT } from "@lib/boot-log";
  import type { LogLine } from "@lib/boot-log";
  import { BUILD_DATE } from "@lib/build-info";
  import { onMount } from "svelte";

  interface Props {
    /** One line per loading task, live (the kernel's Loader). */
    lines: readonly LogLine[];
    /** The tasks the boot waits for are done, failed, or in the background. */
    settled: boolean;
    /** The log finished printing; the boot moves on to the splash. */
    onDone: () => void;
    /** The visitor asked to skip; the shell jumps straight to the desktop. */
    onSkip: () => void;
  }

  let { lines, settled, onDone, onSkip }: Props = $props();

  // Lines appear one at a time, fast enough to read as a machine waking up;
  // each shows its task's live state, so real work can outlast its line.
  const LINE_INTERVAL_MS = 140;
  const FINAL_PAUSE_MS = 300;
  const CLOSING_LINE = "Starting RetroOS desktop environment...";

  let shown = $state(0);
  let reduced = $state(false);
  // The closing line takes a beat of its own after the last task line.
  const closing = $derived(settled && lines.length > 0 && shown > lines.length);
  const visible = $derived(lines.slice(0, shown));
  const progress = $derived(
    closing ? 100 : overallPercent(lines.map((line, i) => (i < shown ? line : { ...line, status: "wait" }))),
  );

  onMount(() => {
    reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const step = window.setInterval(() => {
      if (shown <= lines.length) shown += 1;
    }, LINE_INTERVAL_MS);
    return () => window.clearInterval(step);
  });

  // Under reduced motion every line is there at once.
  $effect(() => {
    if (reduced) shown = lines.length + 1;
  });

  $effect(() => {
    if (!closing) return;
    const t = window.setTimeout(onDone, reduced ? 200 : FINAL_PAUSE_MS);
    return () => window.clearTimeout(t);
  });

  function count(line: LogLine): string {
    return `${line.done ?? 0}/${line.total ?? 0}`.padStart(7);
  }
</script>

<div class="boot-frame">
  <div class="boot-bezel">
    <div class="boot-screen boot-text-glow">
      <div class="boot-scanlines crt-scanlines" aria-hidden="true"></div>
      <div class="boot-vignette crt-vignette" aria-hidden="true"></div>

      <!-- Decoration, not news: read aloud it was a line every 140 ms. The
           splash after it announces the boot. -->
      <header class="boot-header" aria-hidden="true">
        <span class="boot-host">RETRO BIOS v9.95.06</span>
        <span class="boot-meta">Build {BUILD_DATE} // 640K OK</span>
      </header>

      <div class="boot-log retro-scroll" aria-hidden="true">
        {#each visible as line, i (line.id)}
          <div class="boot-line" data-boot-task={line.id} data-status={line.status}>
            <span class="boot-key">{leader(line.label)}</span>
            {#if line.note}
              <span>{line.note}</span>
            {:else if line.total !== undefined}
              <span>{count(line)}</span><span class="boot-wide">{bar(line.done ?? 0, line.total)}</span>
            {/if}
            {#if line.bytes}<span class="boot-wide boot-size">{formatBytes(line.bytes)}</span>{/if}
            {#if STATUS_TEXT[line.status]}
              <span class="boot-status">[{STATUS_TEXT[line.status]}]</span>
            {:else if i === visible.length - 1 && !closing}
              <span class={reduced ? "" : "boot-caret"}>▌</span>
            {/if}
          </div>
        {/each}
        {#if closing}
          <div class="boot-line">
            <span class="boot-key">{CLOSING_LINE}</span><span class={reduced ? "" : "boot-caret"}>▌</span>
          </div>
        {/if}
      </div>

      <footer class="boot-footer">
        <div class="boot-progress-wrap" aria-hidden="true">
          <div class="boot-progress-track">
            <div class="boot-progress-fill" style:width={`${progress}%`}></div>
          </div>
          <span class="boot-percent">{progress}%</span>
        </div>

        <button
          type="button"
          onclick={(e) => {
            e.stopPropagation();
            onSkip();
          }}
          class="bevel-out bg-surface text-13 text-text px-2 py-0.5"
        >
          Skip [Esc]
        </button>
      </footer>
    </div>
  </div>
</div>

<style>
  @keyframes flicker {
    0%,
    100% {
      opacity: 0.97;
    }
    50% {
      opacity: 1;
    }
  }

  @keyframes boot-cursor {
    50% {
      opacity: 0;
    }
  }

  /* ---- elevated boot terminal ---- */
  @keyframes boot-line-in {
    from {
      opacity: 0;
      transform: translateX(-4px);
      text-shadow: 0 0 14px var(--boot-glow);
    }
    to {
      opacity: 1;
      transform: translateX(0);
      text-shadow: 0 0 6px var(--boot-glow);
    }
  }

  .boot-frame {
    position: fixed;
    inset: 0;
    z-index: var(--z-boot);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: var(--boot-bg);
    font-family: var(--font-mono);
  }

  .boot-bezel {
    width: min(1100px, 100%);
    height: min(700px, 100%);
    border: 2px solid;
    border-color: var(--bevel-light) var(--bevel-dark) var(--bevel-dark) var(--bevel-light);
    background: color-mix(in srgb, var(--surface-deep) 86%, var(--shade) 14%);
    box-shadow:
      inset 0 0 0 1px color-mix(in srgb, var(--bevel-shadow) 50%, transparent),
      inset 0 0 40px color-mix(in srgb, var(--boot-glow) 24%, transparent),
      0 12px 28px color-mix(in srgb, var(--shade) 58%, transparent);
    padding: 12px;
  }

  .boot-screen {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    overflow: hidden;
    border: 1px solid color-mix(in srgb, var(--bevel-shadow) 72%, transparent);
    background:
      radial-gradient(circle at 50% -30%, color-mix(in srgb, var(--cyan) 18%, transparent), transparent 50%),
      linear-gradient(
        to bottom,
        color-mix(in srgb, var(--boot-bg) 88%, var(--shade) 12%),
        color-mix(in srgb, var(--boot-bg) 70%, var(--shade) 30%)
      );
    animation: flicker 4s steps(3, end) infinite;
  }

  .boot-header {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 10px 14px;
    border-bottom: 1px dashed color-mix(in srgb, var(--boot-muted) 40%, transparent);
    color: var(--boot-muted);
    font-size: var(--fs-14);
    letter-spacing: 0.05em;
  }

  .boot-meta {
    opacity: 0.88;
  }

  .boot-log {
    position: relative;
    z-index: 2;
    flex: 1;
    min-height: 0;
    overflow: auto;
    padding: 14px;
    color: var(--boot-fg);
    font-size: var(--fs-18);
    line-height: 1.35;
  }

  /* A row of parts a character apart; the whitespace between them in the markup doesn't count. */
  .boot-line {
    display: flex;
    flex-wrap: wrap;
    column-gap: 1ch;
    white-space: pre;
    animation: boot-line-in 220ms var(--ease-out) both;
  }

  .boot-caret {
    animation: boot-cursor 1s steps(1, end) infinite;
  }

  .boot-key {
    color: color-mix(in srgb, var(--magenta) 72%, var(--boot-fg) 28%);
  }

  .boot-host {
    color: color-mix(in srgb, var(--cyan) 76%, var(--boot-fg) 24%);
  }

  .boot-size {
    color: var(--boot-muted);
  }

  .boot-line[data-status="ok"] .boot-status {
    color: var(--ok);
  }

  .boot-line[data-status="err"] .boot-status {
    color: var(--err);
  }

  .boot-line[data-status="skip"] .boot-status,
  .boot-line[data-status="bg"] .boot-status {
    color: var(--boot-muted);
  }

  .boot-footer {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    padding: 10px 14px 12px;
    border-top: 1px dashed color-mix(in srgb, var(--boot-muted) 34%, transparent);
  }

  .boot-progress-wrap {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: min(520px, 70%);
  }

  .boot-progress-track {
    width: min(460px, 100%);
    height: 10px;
    border: 1px solid;
    border-color: var(--bevel-light) var(--bevel-dark) var(--bevel-dark) var(--bevel-light);
    background: var(--surface-deep);
    box-shadow: inset 1px 1px 0 color-mix(in srgb, var(--bevel-shadow) 75%, transparent);
    overflow: hidden;
  }

  .boot-progress-fill {
    height: 100%;
    background: linear-gradient(to right, color-mix(in srgb, var(--magenta) 75%, var(--boot-fg) 25%), var(--cyan));
    box-shadow: 0 0 12px color-mix(in srgb, var(--cyan) 55%, transparent);
    transition: width var(--dur-2) linear;
  }

  .boot-percent {
    min-width: 3ch;
    color: var(--boot-muted);
    font-size: var(--fs-14);
  }

  .boot-scanlines,
  .boot-vignette {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .boot-scanlines {
    z-index: 3;
    opacity: 0.45;
  }

  .boot-vignette {
    z-index: 4;
    opacity: 0.6;
  }
  @media (prefers-reduced-motion: reduce) {
    .boot-screen,
    .boot-line,
    .boot-caret {
      animation: none;
    }
    .boot-progress-fill {
      transition: none;
    }
  }

  @media (max-width: 900px) {
    .boot-frame {
      padding: 12px;
    }

    .boot-bezel {
      height: min(620px, 100%);
      padding: 10px;
    }

    .boot-log {
      font-size: var(--fs-16);
      line-height: 1.45;
    }

    /* The short format: label, count and status; no bar or size. */
    .boot-wide {
      display: none;
    }

    .boot-footer {
      flex-direction: column;
      align-items: stretch;
      gap: 10px;
    }

    .boot-progress-wrap {
      min-width: 0;
      width: 100%;
    }

    .boot-progress-track {
      width: 100%;
    }
  }

  .boot-text-glow {
    text-shadow: 0 0 6px var(--boot-glow);
  }
</style>
