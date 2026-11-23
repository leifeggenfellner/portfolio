<script lang="ts">
  import { PROFILE } from "virtual:content/profile";
  import { PROJECTS } from "virtual:content/projects";
  import { SKILL_GROUPS } from "virtual:content/skills";
  import type { AppProps } from "@lib/app-shell";
  import { getOs } from "@lib/os/context";
  import { dir, file } from "./fs";
  import type { FsNode } from "./fs";
  import { complete, execute, prompt } from "./shell";
  import type { Line, ShellContext, TerminalEffect } from "./shell";
  import { prefersReducedMotion } from "@lib/motion";
  import { onMount, tick, untrack } from "svelte";
  import MatrixRain from "./MatrixRain.svelte";
  import PipesCanvas from "./PipesCanvas.svelte";

  let { shell, args }: AppProps = $props();
  const { settings } = getOs();

  const HOST = "retro";
  const HOME = ["home", PROFILE.handle];
  const BOOTED_AT = Date.now();

  interface Entry extends Line {
    id: number;
  }

  function aboutLines(): string[] {
    return [
      PROFILE.name,
      PROFILE.role + (PROFILE.location ? `, ${PROFILE.location}` : ""),
      "",
      ...PROFILE.bio.paragraphs,
    ];
  }

  function buildFs() {
    const projects: Record<string, FsNode> = {};
    for (const p of PROJECTS) {
      projects[`${p.slug}.prj`] = file(
        [
          `${p.name} (${p.year})`,
          p.tagline,
          "",
          p.summary,
          "",
          `role: ${p.role}`,
          `tech: ${p.tech.join(", ")}`,
          ...(p.url ? [`live: ${p.url}`] : []),
          ...(p.repo ? [`repo: ${p.repo}`] : []),
          `page: ${new URL(`${import.meta.env.BASE_URL}projects/${p.slug}/`, import.meta.env.SITE)}`,
        ],
        "projects",
      );
    }
    const skills = SKILL_GROUPS.flatMap((group) => [
      `[${group.name}]`,
      ...group.skills.map((s) => `  ${s.name.padEnd(22)}${s.evidence}`),
    ]);
    const timeline = (heading: string, entries: typeof PROFILE.experience) => [
      `[${heading}]`,
      ...entries.map((e) => `  ${e.when.padEnd(11)}${e.title}, ${e.org}`),
    ];
    const cv = [...timeline("work", PROFILE.experience), "", ...timeline("education", PROFILE.education)];
    const contact = [
      ...(PROFILE.email ? [`mail: ${PROFILE.email}`] : []),
      ...PROFILE.links.map((link) => `${link.label.toLowerCase()}: ${link.url}`),
    ];
    return dir({
      home: dir({
        [PROFILE.handle]: dir({
          "about.txt": file(aboutLines(), "about"),
          "cv.txt": file(cv, "about"),
          "skills.txt": file(skills, "skills"),
          "contact.txt": file(contact, "contact"),
          projects: dir(projects),
          games: dir({ "minesweeper.exe": file(["MZ\u0090 binary. try: open minesweeper.exe"], "minigame") }),
        }),
      }),
      etc: dir({ motd: file(["welcome to retro//os. nothing here is fake."]) }),
    });
  }

  const root = buildFs();

  let nextId = 2;
  // The banner is there from the first render, so the Terminal's page shows it without JS.
  let entries = $state<Entry[]>([
    { id: 0, text: "RETRO//OS terminal. retro-sh, read-only filesystem.", tone: "accent" },
    { id: 1, text: "type 'help' to list commands, or try 'cat about.txt'.", tone: "dim" },
  ]);
  let cwd = $state<string[]>([...HOME]);
  let input = $state("");
  let history = $state<string[]>([]);
  // Position while walking history with the arrow keys; history.length means "the line being typed".
  let historyIndex = $state(0);
  let draft = "";
  let inputEl = $state<HTMLInputElement>();
  // Set by the hidden `panic` command. The throw has to happen while rendering,
  // where the window's error boundary can catch it; a click handler can't.
  let panicked = $state(false);
  // The toy playing over the pane, if any.
  let toy = $state<TerminalEffect | null>(null);

  function crash(): never {
    throw new Error("Kernel panic: not syncing");
  }
  let scroller = $state<HTMLElement>();

  const promptText = $derived(prompt({ user: PROFILE.handle, host: HOST, cwd, home: HOME }));

  function print(lines: Line[]) {
    entries = [...entries, ...lines.map((line) => ({ ...line, id: nextId++ }))].slice(-500);
  }

  function uptime(): string {
    const minutes = Math.floor((Date.now() - BOOTED_AT) / 60_000);
    return minutes < 1 ? "less than a minute" : `${minutes} min`;
  }

  function context(): ShellContext {
    const prefs = settings.current;
    return {
      root,
      home: HOME,
      cwd,
      user: PROFILE.handle,
      host: HOST,
      history,
      apps: shell.apps,
      whoami: [`${PROFILE.name}: ${PROFILE.role.toLowerCase()}`],
      neofetch: [
        ["OS", "RetroOS (static, GitHub Pages)"],
        ["Shell", "retro-sh"],
        ["WM", "BevelWM"],
        ["Theme", `${prefs.theme}, crt ${prefs.crt}`],
        ["Screen", `${window.innerWidth}x${window.innerHeight}`],
        ["Uptime", uptime()],
        ["Stack", "Astro, Svelte 5, TypeScript"],
      ],
      actions: {
        open: (appId) => shell.open(appId),
        setTheme: (theme) => settings.set("theme", theme),
        setCrt: (mode) => settings.set("crt", mode),
        setGridSpeed: (speed) => settings.set("gridSpeed", speed),
        exit: () => shell.close(),
        panic: () => (panicked = true),
      },
      now: () => new Date(),
      random: Math.random,
    };
  }

  async function scrollToEnd() {
    await tick();
    scroller?.scrollTo({ top: scroller.scrollHeight });
  }

  function submit() {
    const line = input;
    print([{ text: `${promptText} ${line}`, tone: "prompt" }]);
    if (line.trim()) history = [...history, line].slice(-100);
    historyIndex = history.length;
    input = "";
    const result = execute(line, context());
    if (result.clear) entries = [];
    if (result.cwd) cwd = result.cwd;
    print(result.lines);
    if (result.effect) {
      if (prefersReducedMotion())
        print([{ text: `${result.effect.name}: skipped, reduced motion is on.`, tone: "dim" }]);
      else toy = result.effect;
    }
    void scrollToEnd();
  }

  function endEffect() {
    toy = null;
    inputEl?.focus({ preventScroll: true });
  }

  function walkHistory(step: number) {
    if (!history.length) return;
    if (historyIndex === history.length) draft = input;
    historyIndex = Math.max(0, Math.min(history.length, historyIndex + step));
    input = historyIndex === history.length ? draft : (history[historyIndex] ?? "");
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      walkHistory(e.key === "ArrowUp" ? -1 : 1);
    } else if (e.key === "Tab" && !e.shiftKey && input.trim()) {
      // An empty line lets Tab move focus on, so the terminal never traps the keyboard.
      e.preventDefault();
      const result = complete(input, context());
      input = result.input;
      if (result.options.length) {
        print([
          { text: `${promptText} ${input}`, tone: "prompt" },
          { text: result.options.join("  "), tone: "dim" },
        ]);
        void scrollToEnd();
      }
    } else if (e.ctrlKey && e.key.toLowerCase() === "l") {
      e.preventDefault();
      entries = [];
    } else if (e.ctrlKey && e.key.toLowerCase() === "c" && !hasSelection()) {
      e.preventDefault();
      print([{ text: `${promptText} ${input}^C`, tone: "prompt" }]);
      input = "";
      historyIndex = history.length;
      void scrollToEnd();
    }
  }

  /** Ctrl+C copies when text is selected and cancels the line otherwise. */
  function hasSelection(): boolean {
    const inField = inputEl && inputEl.selectionStart !== inputEl.selectionEnd;
    return Boolean(inField || window.getSelection()?.toString());
  }

  // Clicking the screen types into the prompt, unless the click was a text selection.
  function focusInput() {
    if (window.getSelection()?.toString()) return;
    inputEl?.focus({ preventScroll: true });
  }

  const TONE_CLASS: Record<NonNullable<Line["tone"]> | "out", string> = {
    out: "",
    dim: "text-terminal-dim",
    err: "text-terminal-err",
    accent: "text-terminal-accent",
    prompt: "text-terminal-prompt",
  };

  onMount(() => {
    inputEl?.focus({ preventScroll: true });
  });

  // A launch can ask for a command (the palette); run it as if typed, once per launch.
  $effect(() => {
    const command = args?.command;
    if (!command) return;
    untrack(() => {
      input = command;
      submit();
    });
  });
</script>

{#if panicked}{crash()}{/if}

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div
  class="bg-terminal-bg text-terminal-fg font-mono text-18 relative flex h-full min-h-0 cursor-text flex-col leading-tight [text-shadow:0_0_6px_var(--terminal-glow)] selection:bg-terminal-fg selection:text-terminal-bg"
  onclick={focusInput}
>
  <div bind:this={scroller} class="retro-scroll min-h-0 flex-1 overflow-y-auto px-3 pt-2 pb-1">
    <div role="log" aria-label="Terminal output" aria-live="polite">
      {#each entries as entry (entry.id)}
        <p class={["break-words whitespace-pre-wrap", TONE_CLASS[entry.tone ?? "out"]]}>{entry.text || " "}</p>
      {/each}
    </div>
    <form
      class="has-[:focus-visible]:outline-terminal-dim mb-2 flex items-baseline gap-2 outline-offset-2 has-[:focus-visible]:outline-1 has-[:focus-visible]:outline-dashed"
      onsubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <label for="terminal-input" class="text-terminal-prompt shrink-0">{promptText}</label>
      <input
        bind:this={inputEl}
        bind:value={input}
        id="terminal-input"
        data-autofocus
        class="caret-terminal-fg min-w-0 flex-1 border-0 bg-transparent p-0 text-inherit outline-none [font:inherit] [text-shadow:inherit]"
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        enterkeyhint="send"
        onkeydown={handleKeydown}
      />
    </form>
  </div>
  {#if toy?.name === "matrix"}
    <MatrixRain onDone={endEffect} />
  {:else if toy?.name === "pipes"}
    <PipesCanvas count={toy.count} onDone={endEffect} />
  {/if}
</div>
