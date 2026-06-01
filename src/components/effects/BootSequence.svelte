<script lang="ts">
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
    onDone: () => void;
  }

  let { onDone }: Props = $props();

  let printed = $state<string[]>([]);
  let skipped = $state(false);
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

  onMount(() => {
    reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === " " || e.key === "Enter") {
        skipped = true;
        finish();
      }
    };

    window.addEventListener("keydown", onKey);

    if (reduced) {
      const t = window.setTimeout(finish, 200);
      return () => {
        window.removeEventListener("keydown", onKey);
        window.clearTimeout(t);
      };
    }

    let i = 0;
    const step = window.setInterval(() => {
      i += 1;
      printed = LINES.slice(0, i);
      if (i >= LINES.length) {
        window.clearInterval(step);
        window.setTimeout(finish, 600);
      }
    }, 380);

    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearInterval(step);
    };
  });
</script>

{#if !skipped}
  <div class="boot-frame">
    <div class="boot-bezel">
      <div class="boot-screen boot-text-glow" role="status" aria-live="polite" aria-label="Booting RetroOS">
        <div class="boot-scanlines crt-scanlines" aria-hidden="true"></div>
        <div class="boot-vignette crt-vignette" aria-hidden="true"></div>

        <header class="boot-header">
          <span class="boot-host">RETRO BIOS v9.95.06</span>
          <span class="boot-meta">Build 2026.06.01 // 640K OK</span>
        </header>

        <div class="boot-log retro-scroll">
          {#each printed as line, i (i)}
            <div class="boot-line">
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
              skipped = true;
              finish();
            }}
            class="bevel-out bg-surface text-13 text-text px-2 py-0.5"
          >
            Skip [Esc]
          </button>
        </footer>
      </div>
    </div>
  </div>
{/if}
