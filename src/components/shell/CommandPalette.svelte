<script lang="ts">
  import { fuzzyMatch } from "@lib/fuzzy";
  import { motion } from "@lib/motion";
  import { PROJECTS } from "virtual:content/projects";
  import { paletteItems, searchPalette } from "@lib/palette";
  import type { PaletteApp, PaletteItem } from "@lib/palette";
  import { onMount, tick } from "svelte";
  import type { TransitionConfig } from "svelte/transition";

  interface Props {
    apps: readonly PaletteApp[];
    onRun: (item: PaletteItem) => void;
    onClose: () => void;
  }

  let { apps, onRun, onClose }: Props = $props();

  // Built here, not in the Desktop, so the project data loads with the palette.
  const items = $derived(paletteItems(apps, PROJECTS));

  let query = $state("");
  // Typing starts the list over at its best match; arrow keys move it from there.
  let active = $derived.by(() => {
    void query;
    return 0;
  });
  let inputEl = $state<HTMLInputElement>();
  let listEl = $state<HTMLElement>();
  let panelEl = $state<HTMLElement>();

  const results = $derived(searchPalette(items, query));
  const current = $derived(results[active]);
  const activeId = $derived(current ? `palette-option-${current.id}` : undefined);

  function move(to: number) {
    if (!results.length) return;
    active = (to + results.length) % results.length;
    void tick().then(() => listEl?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" }));
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "ArrowDown") move(active + 1);
    else if (e.key === "ArrowUp") move(active - 1);
    else if (e.key === "Home" && e.ctrlKey) move(0);
    else if (e.key === "End" && e.ctrlKey) move(results.length - 1);
    else if (e.key === "Enter") {
      const item = results[active];
      if (item) onRun(item);
    } else if (e.key === "Escape") onClose();
    // The search field is the only stop in this modal, so Tab stays put.
    else if (e.key !== "Tab") return;
    e.preventDefault();
    // Keep Escape from also closing the window underneath.
    e.stopPropagation();
  }

  /** The label split into plain and matched runs, for highlighting. */
  function parts(label: string): { text: string; hit: boolean }[] {
    const hits = new Set(fuzzyMatch(query, label)?.indices ?? []);
    const runs: { text: string; hit: boolean }[] = [];
    [...label].forEach((char, i) => {
      const hit = hits.has(i);
      const last = runs.at(-1);
      if (last && last.hit === hit) last.text += char;
      else runs.push({ text: char, hit });
    });
    return runs;
  }

  function handleBackdrop(e: PointerEvent) {
    if (!panelEl?.contains(e.target as Node)) onClose();
  }

  // Drops in from just above; leaves faster than it arrives.
  function paletteMotion(node: Element, { leaving }: { leaving: boolean }): TransitionConfig {
    return motion(node, {
      duration: leaving ? ["--dur-1", 80] : ["--dur-2", 160],
      css: (t, u) => `transform: translateY(${u * -8}px); opacity: ${t};`,
    });
  }

  onMount(() => inputEl?.focus());

  const TITLE_BAR_CLASS = ["font-chrome text-15 flex h-7 items-center px-1.5", "title-bar title-text-shadow"].join(" ");
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="fixed inset-0 z-(--z-palette) flex items-start justify-center px-4 pt-[14vh]"
  onpointerdown={handleBackdrop}
>
  <div
    bind:this={panelEl}
    role="dialog"
    aria-modal="true"
    aria-labelledby="palette-title"
    class="bevel-out bg-surface shadow-window flex w-full max-w-lg flex-col p-0.75"
    in:paletteMotion={{ leaving: false }}
    out:paletteMotion={{ leaving: true }}
  >
    <div class={TITLE_BAR_CLASS}>
      <h2 id="palette-title" class="text-15 font-normal">Run</h2>
    </div>
    <div class="flex flex-col gap-1.5 p-2">
      <input
        bind:this={inputEl}
        bind:value={query}
        type="text"
        role="combobox"
        aria-label="Search apps, projects, settings and commands"
        aria-expanded="true"
        aria-controls="palette-results"
        aria-autocomplete="list"
        aria-activedescendant={activeId}
        autocomplete="off"
        spellcheck="false"
        placeholder="Type to search…"
        class="bevel-in-thin bg-surface-3 text-text text-15 focus-ring w-full px-2 py-1.5 placeholder:text-text-dim"
        onkeydown={handleKeydown}
      />
      <ul
        bind:this={listEl}
        id="palette-results"
        role="listbox"
        aria-label="Results"
        class="bevel-in bg-surface-3 retro-scroll max-h-[min(20rem,50vh)] overflow-y-auto py-0.5"
      >
        {#each results as item, i (item.id)}
          <!-- Clicks are a shortcut for the keyboard path (arrows + Enter) on the combobox. -->
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <li
            id={`palette-option-${item.id}`}
            role="option"
            aria-selected={i === active}
            class={[
              "text-14 flex cursor-pointer items-center justify-between gap-3 px-2.5 py-1",
              i === active ? "title-bar" : "text-text",
            ]}
            onpointermove={() => (active = i)}
            onclick={() => onRun(item)}
          >
            <span class="truncate">
              {#each parts(item.label) as part, p (p)}
                {#if part.hit}<span class="font-bold underline underline-offset-2">{part.text}</span
                  >{:else}{part.text}{/if}
              {/each}
            </span>
            <span class={["text-12 shrink-0", i === active ? "" : "text-text-dim"]}>{item.group}</span>
          </li>
        {/each}
      </ul>
      {#if !results.length}
        <p class="text-13 text-text px-1" role="status">Nothing matches “{query}”.</p>
      {/if}
      <p class="text-12 text-text px-1">↑↓ to choose · Enter to run · Esc to close</p>
    </div>
  </div>
</div>
