<script lang="ts">
  import { BUILD_DATE } from "@lib/build-info";
  import { onMount } from "svelte";

  const LINES = [
    "RETRO BIOS v9.95.06 — (c) Retro Systems",
    "Detecting CPU.................. OK",
    "Detecting RAM.................. 640K (the perfect amount)",
    "Detecting GPU.................. CRT-mode enabled",
    "Mounting /home/visitor......... OK",
    "Loading kernel module: vaporwave.ko",
    "Loading kernel module: window-mgr.ko",
    "Starting RetroOS desktop environment...",
  ];

  interface Props {
    /** The log finished printing; the boot moves on to the splash. */
    onDone: () => void;
    /** The visitor asked to skip; the shell jumps straight to the desktop. */
    onSkip: () => void;
  }

  let { onDone, onSkip }: Props = $props();

  // Fast enough to read as a machine waking up, not a wait.
  const LINE_INTERVAL_MS = 140;
  const FINAL_PAUSE_MS = 300;

  let printed = $state<string[]>([]);
  let done = false;
  let reduced = $state(false);
  let progress = $derived(Math.round((printed.length / LINES.length) * 100));

  // LINES is a static constant defined in this file, so this HTML formatting is safe.
  function formatLine(line: string): string {
    let out = line;
    out = out.replace(
      /^(Detecting [^.]*(?:\.{2,}|:)|Loading kernel module:|Mounting [^.]*(?:\.{2,}|:)|Starting [^.]*\.\.\.)/,
      '<span class="boot-key">$1</span>',
    );
    out = out.replace(/\b(RETRO BIOS|RetroOS)\b/g, '<span class="boot-host">$1</span>');
    out = out.replace(/\sOK$/, ' <span class="boot-ok">[OK]</span>');
    return out;
  }

  function finish() {
    if (done) return;
    done = true;
    onDone();
  }

  // Skip keys are handled by the shell, which owns every boot phase.
  onMount(() => {
    reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      printed = LINES;
      const t = window.setTimeout(finish, 200);
      return () => window.clearTimeout(t);
    }

    let i = 0;
    let pause: number | undefined;
    const step = window.setInterval(() => {
      i += 1;
      printed = LINES.slice(0, i);
      if (i >= LINES.length) {
        window.clearInterval(step);
        pause = window.setTimeout(finish, FINAL_PAUSE_MS);
      }
    }, LINE_INTERVAL_MS);

    return () => {
      window.clearInterval(step);
      window.clearTimeout(pause);
    };
  });
</script>

<div class="boot-frame">
  <div class="boot-bezel">
    <div class="boot-screen boot-text-glow" role="status" aria-live="polite" aria-label="Booting RetroOS">
      <div class="boot-scanlines crt-scanlines" aria-hidden="true"></div>
      <div class="boot-vignette crt-vignette" aria-hidden="true"></div>

      <header class="boot-header">
        <span class="boot-host">RETRO BIOS v9.95.06</span>
        <span class="boot-meta">Build {BUILD_DATE} // 640K OK</span>
      </header>

      <div class="boot-log retro-scroll">
        {#each printed as line, i (i)}
          <div class="boot-line">
            <!-- eslint-disable-next-line svelte/no-at-html-tags -- the boot script's own fixed lines, highlighted; no user input -->
            {@html formatLine(line)}{#if i === printed.length - 1}<span class={reduced ? "" : "boot-caret"}>▌</span
              >{/if}
          </div>
        {/each}
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

  .boot-line {
    white-space: pre-wrap;
    animation: boot-line-in 220ms var(--ease-out) both;
  }

  .boot-caret {
    animation: boot-cursor 1s steps(1, end) infinite;
  }

  .boot-screen :global(.boot-key) {
    color: color-mix(in srgb, var(--magenta) 72%, var(--boot-fg) 28%);
  }

  .boot-host {
    color: color-mix(in srgb, var(--cyan) 76%, var(--boot-fg) 24%);
  }

  .boot-screen :global(.boot-ok) {
    color: var(--ok);
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
