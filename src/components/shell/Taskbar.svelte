<script lang="ts">
  import { cx } from "@lib/cx";
  import type { AppWindow } from "@lib/os/window-manager.svelte";
  import RetroButton from "@primitives/RetroButton.svelte";
  import { onMount } from "svelte";
  import StartMenu from "./StartMenu.svelte";
  import type { StartMenuItem } from "./StartMenu.svelte";

  interface Props {
    windows: readonly AppWindow[];
    activeId: string | null;
    menuItems: StartMenuItem[];
    onToggleWindow: (id: string) => void;
    onMenuSelect: (id: string, origin: DOMRect) => void;
  }

  let { windows, activeId, menuItems, onToggleWindow, onMenuSelect }: Props = $props();

  let startWrap = $state<HTMLElement>();
  let menuOpen = $state(false);
  let now = $state(new Date());

  const clock = $derived(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
  const clockIso = $derived(now.toISOString());

  function startButton(): HTMLButtonElement | null {
    return startWrap?.querySelector("button") ?? null;
  }

  function closeMenu(restoreFocus: boolean) {
    menuOpen = false;
    if (restoreFocus) startButton()?.focus();
  }

  // Tick on the minute boundary so the clock never lags by up to a minute.
  onMount(() => {
    let interval: number | undefined;
    const timeout = window.setTimeout(
      () => {
        now = new Date();
        interval = window.setInterval(() => (now = new Date()), 60_000);
      },
      60_000 - (Date.now() % 60_000),
    );
    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  });
</script>

<nav
  aria-label="Taskbar"
  class="bevel-out-thin bg-surface fixed inset-x-0 bottom-0 z-(--z-taskbar) flex h-(--taskbar-height) items-center gap-1 px-1"
>
  <span bind:this={startWrap} class="contents">
    <RetroButton
      active={menuOpen}
      aria-pressed={undefined}
      aria-haspopup="menu"
      aria-expanded={menuOpen}
      class="phone:h-11 gap-1.5 px-2.5"
      onclick={() => (menuOpen = !menuOpen)}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" class="shrink-0">
        <defs>
          <linearGradient id="taskbar-sun" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="var(--magenta)" />
            <stop offset="1" stop-color="var(--cyan)" />
          </linearGradient>
        </defs>
        <path d="M2 11a6 6 0 0 1 12 0Z" fill="url(#taskbar-sun)" />
        <path d="M2 8.5h12M2 10h12" stroke="var(--surface)" stroke-width="0.9" />
        <path d="M1 13h14" stroke="var(--text)" stroke-width="1.5" />
      </svg>
      <span>Start</span>
    </RetroButton>
  </span>

  <span aria-hidden="true" class="mx-0.5 h-6 border-r border-l border-r-(--bevel-light) border-l-(--bevel-shadow)"
  ></span>

  <div role="group" aria-label="Open windows" class="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
    {#each windows as w (w.id)}
      <RetroButton
        data-taskbar-window={w.id}
        active={activeId === w.id && !w.minimized}
        title={w.title}
        aria-label={w.title}
        class="phone:h-11 phone:w-11 phone:px-0 w-44 min-w-0 shrink justify-start"
        onclick={() => onToggleWindow(w.id)}
      >
        {#if w.icon}
          <img src={w.icon} alt="" width="16" height="16" class="h-4 w-4 shrink-0 object-contain" />
        {/if}
        <span class={cx("phone:hidden max-w-34 truncate font-normal", w.minimized && "text-text-dim")}>{w.title}</span>
      </RetroButton>
    {/each}
  </div>

  <div class="bevel-in-thin text-text flex h-7 shrink-0 items-center px-2.5 font-mono text-[length:var(--fs-18)]">
    <time datetime={clockIso}>{clock}</time>
  </div>
</nav>

{#if menuOpen}
  <StartMenu items={menuItems} anchor={startWrap} onSelect={onMenuSelect} onClose={closeMenu} />
{/if}
