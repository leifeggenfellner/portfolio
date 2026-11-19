<script lang="ts">
  import type { Component } from "svelte";
  import { onMount, tick } from "svelte";
  import { APPS } from "@apps/registry.svelte";
  import BootSequence from "@effects/BootSequence.svelte";
  import CrtLayer from "@effects/CrtLayer.svelte";
  import LoadingSplash from "@effects/LoadingSplash.svelte";
  import Wallpaper from "@effects/Wallpaper.svelte";
  import { dismissHelpNote, isHelpNoteDismissed } from "@lib/help-note";
  import { applySettingsToRoot } from "@lib/settings";
  import type { Settings } from "@lib/settings";
  import { settings } from "@lib/store/settings";
  import { windowManager } from "@lib/store/window-manager";
  import { cx } from "@lib/cx";
  import ContextMenu from "@primitives/ContextMenu.svelte";
  import type { MenuEntry } from "@primitives/ContextMenu.svelte";
  import RetroWindow from "@primitives/RetroWindow.svelte";
  import { clampWindowPosition } from "@lib/window-bounds";
  import HelpNote from "./HelpNote.svelte";
  import type { StartMenuItem } from "./StartMenu.svelte";
  import Taskbar from "./Taskbar.svelte";

  const MOBILE_QUERY = "(max-width: 768px)";
  const MIN_LOADING_MS = 800;
  const FALLBACK_TASKBAR_HEIGHT = 36;

  const MAIN_CLASS = "relative h-screen w-screen overflow-hidden bg-desktop";
  const ICON_GRID_BASE = "absolute top-4 z-(--z-desktop) [--focus-ring-color:var(--desktop-text)]";
  const ICON_GRID_DESKTOP =
    "left-4 flex max-h-[calc(100dvh-2rem-var(--taskbar-height))] flex-col flex-wrap content-start gap-3";
  const ICON_GRID_MOBILE = "left-3 right-3 grid grid-cols-4 gap-3";
  const ICON_BUTTON_BASE = "focus-ring icon-label text-12 flex flex-col items-center gap-1 p-1 text-white";
  const ICON_BUTTON_DESKTOP = "w-19";
  const ICON_BUTTON_MOBILE = "w-full";
  const ICON_IMG_CLASS = "icon-glow h-(--desktop-icon-size) w-(--desktop-icon-size) object-contain";
  const SYS_BADGE_CLASS = [
    "pointer-events-none absolute top-3.5 right-4 z-(--z-desktop)",
    "text-right text-white/85",
    "[text-shadow:0_0_14px_color-mix(in_srgb,var(--magenta)_60%,transparent)]",
  ].join(" ");

  let ready = $state(false);
  let booted = $state(false);
  let isMobile = $state(false);
  let prefs = $state<Settings>(settings.get());
  let settingsReady = $state(false);
  let viewportWidth = $state(0);
  let viewportHeight = $state(0);
  let taskbarHeight = $state(FALLBACK_TASKBAR_HEIGHT);
  let selectedIcon = $state<string | null>(null);
  let helpNoteOpen = $state(false);
  let helpNote = $state<ReturnType<typeof HelpNote>>();
  let iconList = $state<HTMLElement>();

  // Where each window should grow from next time it appears: the icon or
  // taskbar button that summoned it. Read once by the window's intro.
  const origins = new Map<string, DOMRect>();

  let wmState = $state(windowManager.get());
  let svelteComponents = $state<Record<string, Component>>({});
  let staticHtml = $state<Record<string, string>>({});

  // Context menu state
  let ctxMenu = $state<{ x: number; y: number } | null>(null);

  const themeLabel = $derived(prefs.theme.toUpperCase());

  const DESKTOP_MENU_ITEMS = $derived<MenuEntry[]>([
    ...APPS.map((a) => ({ id: `open:${a.id}`, label: a.title, icon: "pixelarticons:folder" })),
    { separator: true as const },
    {
      id: "theme:toggle",
      label: prefs.theme === "dark" ? "Light Theme" : "Dark Theme",
      icon: prefs.theme === "dark" ? "lucide:sun" : "lucide:moon",
    },
    { id: "cascade", label: "Cascade Windows", icon: "pixelarticons:layout" },
  ]);

  function handleDesktopContext(e: MouseEvent) {
    e.preventDefault();
    ctxMenu = { x: e.clientX, y: e.clientY };
  }

  const START_MENU_ITEMS: StartMenuItem[] = [
    ...APPS.map((a) => ({ id: `open:${a.id}`, label: a.title, icon: a.icon })),
    { id: "help", label: "Help", icon: "pixelarticons:info-box", iconify: true, separatorBefore: true },
  ];

  function handleStartSelect(id: string, origin: DOMRect) {
    if (id.startsWith("open:")) void launch(id.replace("open:", ""), origin);
    else if (id === "help") void showHelpNote();
  }

  function handleTaskbarToggle(id: string) {
    const button = document.querySelector<HTMLElement>(`[data-taskbar-window="${id}"]`);
    if (button) origins.set(id, button.getBoundingClientRect());
    windowManager.toggleFromTaskbar(id);
  }

  function taskbarButtonRect(id: string): DOMRect | null {
    return document.querySelector(`[data-taskbar-window="${id}"]`)?.getBoundingClientRect() ?? null;
  }

  async function showHelpNote() {
    helpNoteOpen = true;
    await tick();
    helpNote?.focus();
  }

  function closeHelpNote() {
    dismissHelpNote();
    helpNoteOpen = false;
    iconList?.querySelector<HTMLElement>("button")?.focus();
  }

  function handleMenuSelect(id: string) {
    if (id.startsWith("open:")) {
      void launch(id.replace("open:", ""));
    } else if (id === "theme:toggle") {
      settings.set("theme", prefs.theme === "dark" ? "light" : "dark");
    } else if (id === "cascade") {
      windowManager.cascade();
    }
  }

  function syncViewport() {
    isMobile = window.matchMedia(MOBILE_QUERY).matches;
    viewportWidth = window.innerWidth;
    viewportHeight = window.innerHeight;
    const cssHeight = Number.parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--taskbar-height"),
    );
    taskbarHeight = Number.isNaN(cssHeight) ? FALLBACK_TASKBAR_HEIGHT : cssHeight;
  }

  function readStaticTemplate(appId: string): string {
    if (staticHtml[appId]) return staticHtml[appId]!;
    const tpl = document.querySelector<HTMLTemplateElement>(`template[data-static-app="${appId}"]`);
    const html = tpl?.innerHTML ?? "";
    staticHtml = { ...staticHtml, [appId]: html };
    return html;
  }

  async function ensureSvelteLoaded(appId: string, load: () => Promise<{ default: Component }>) {
    const cached = svelteComponents[appId];
    if (cached) return cached;
    try {
      const mod = await load();
      svelteComponents = { ...svelteComponents, [appId]: mod.default };
      return mod.default;
    } catch (error) {
      console.error(`Failed to load app "${appId}"`, error);
      return null;
    }
  }

  async function launch(appId: string, origin?: DOMRect) {
    const app = APPS.find((a) => a.id === appId);
    if (!app) return;
    if (origin) origins.set(app.id, origin);
    if (app.kind === "svelte") {
      const component = await ensureSvelteLoaded(app.id, app.load);
      if (!component) return;
    } else {
      readStaticTemplate(app.id);
    }
    windowManager.open({
      id: app.id,
      appId: app.id,
      title: app.title,
      icon: app.icon,
      ...app.defaults,
    });
  }

  // A mouse click selects and a double-click opens, as on a period desktop.
  // Enter/Space fire a click with detail 0, so the keyboard opens in one press;
  // touch has no double-tap convention here, so a tap opens.
  function handleIconClick(appId: string, e: MouseEvent & { currentTarget: HTMLElement }) {
    selectedIcon = appId;
    if (isMobile || e.detail === 0) void launch(appId, e.currentTarget.getBoundingClientRect());
  }

  function handleIconDoubleClick(appId: string, e: MouseEvent & { currentTarget: HTMLElement }) {
    void launch(appId, e.currentTarget.getBoundingClientRect());
  }

  // Arrow keys walk the icon column; the selection follows focus.
  function handleIconKeydown(e: KeyboardEvent) {
    const buttons = [...(iconList?.querySelectorAll<HTMLElement>("button[data-app-id]") ?? [])];
    const index = buttons.indexOf(document.activeElement as HTMLElement);
    if (index < 0) return;
    const next = {
      ArrowDown: index + 1,
      ArrowRight: index + 1,
      ArrowUp: index - 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: buttons.length - 1,
    }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    const target = buttons[Math.min(Math.max(next, 0), buttons.length - 1)];
    target?.focus();
    selectedIcon = target?.dataset.appId ?? selectedIcon;
  }

  function handleDesktopPointerDown(e: PointerEvent) {
    if (!(e.target as Element).closest("button[data-app-id]")) selectedIcon = null;
  }

  function moveWindow(id: string, width: number, x: number, y: number) {
    const next = clampWindowPosition(x, y, width, {
      width: viewportWidth,
      height: viewportHeight - taskbarHeight,
    });
    windowManager.move(id, next.x, next.y);
  }

  const buildDate = "2026.06.02";

  // Viewport listeners — owns matchMedia + resize.
  $effect(() => {
    syncViewport();
    const media = window.matchMedia(MOBILE_QUERY);
    const onChange = () => syncViewport();
    media.addEventListener("change", onChange);
    window.addEventListener("resize", onChange);
    return () => {
      media.removeEventListener("change", onChange);
      window.removeEventListener("resize", onChange);
    };
  });

  // Window manager subscription — mirror store into local rune state.
  $effect(() => windowManager.subscribe((next) => (wmState = next)));

  $effect(() => settings.subscribe((next) => (prefs = next)));

  // Keyboard focus follows the active window, so opening, restoring or
  // closing a window never strands focus on something that disappeared.
  let lastActiveId: string | null = null;
  $effect(() => {
    const id = wmState.activeId;
    if (id === lastActiveId) return;
    lastActiveId = id;
    void tick().then(() => {
      const current = document.activeElement;
      if (id) {
        const win = document.querySelector<HTMLElement>(`[data-window-id="${id}"]`);
        if (win && !win.contains(current)) win.focus({ preventScroll: true });
      } else if (!current || current === document.body || current.closest("[data-window-id]")) {
        document.querySelector<HTMLElement>('nav[aria-label="Taskbar"] button')?.focus();
      }
    });
  });

  $effect(() => {
    if (!settingsReady) {
      return;
    }

    applySettingsToRoot(document.documentElement, prefs);
  });

  // Minimum splash duration, then show boot sequence.
  onMount(() => {
    settings.hydrate();
    prefs = settings.get();
    settingsReady = true;
    helpNoteOpen = !isHelpNoteDismissed();

    if (!settings.get().bootAnimation) {
      ready = true;
      booted = true;
      return;
    }

    const t = window.setTimeout(() => {
      ready = true;
    }, MIN_LOADING_MS);

    // BootSequence owns skipping once it mounts; a skip key pressed during
    // the splash would otherwise be lost and the full boot would still play.
    const onSplashKey = (e: KeyboardEvent) => {
      if (ready || !["Escape", "Enter", " "].includes(e.key)) return;
      window.clearTimeout(t);
      ready = true;
      booted = true;
    };
    window.addEventListener("keydown", onSplashKey);

    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onSplashKey);
    };
  });
</script>

{#if !ready}
  <LoadingSplash />
{:else if !booted}
  <BootSequence onDone={() => (booted = true)} />
{:else}
  <main class={MAIN_CLASS} oncontextmenu={handleDesktopContext} onpointerdown={handleDesktopPointerDown}>
    <Wallpaper />
    {#if !isMobile}
      <aside class={SYS_BADGE_CLASS} aria-label="System information">
        <p class="font-chrome text-[28px] leading-none tracking-[0.02em]">
          RETRO<span class="text-cyan">//OS</span>
        </p>
        <p class="font-mono mt-1 text-[13px] opacity-80">portfolio kit · v2.6.0 · {themeLabel}</p>
        <p class="font-mono text-[12px] opacity-70">build {buildDate}</p>
      </aside>
    {/if}

    <ul
      bind:this={iconList}
      aria-label="Desktop"
      class={cx(ICON_GRID_BASE, isMobile ? ICON_GRID_MOBILE : ICON_GRID_DESKTOP)}
      onkeydown={handleIconKeydown}
    >
      {#each APPS as a (a.id)}
        <li>
          <button
            type="button"
            data-app-id={a.id}
            data-selected={selectedIcon === a.id}
            ondblclick={(e) => handleIconDoubleClick(a.id, e)}
            onclick={(e) => handleIconClick(a.id, e)}
            onfocus={() => (selectedIcon = a.id)}
            class={cx(ICON_BUTTON_BASE, isMobile ? ICON_BUTTON_MOBILE : ICON_BUTTON_DESKTOP)}
          >
            <img
              src={a.icon}
              alt=""
              aria-hidden="true"
              class={ICON_IMG_CLASS}
              width="24"
              height="24"
              decoding="async"
            />
            <span>{a.title.split(" ")[0]}</span>
          </button>
        </li>
      {/each}
    </ul>

    {#if helpNoteOpen}
      <HelpNote bind:this={helpNote} mobile={isMobile} onDismiss={closeHelpNote} />
    {/if}

    {#each wmState.windows as w (w.id)}
      {@const app = APPS.find((a) => a.id === w.appId)}
      {#if app}
        <RetroWindow
          id={w.id}
          title={w.title}
          icon={w.icon}
          active={wmState.activeId === w.id}
          z={w.z}
          minimized={w.minimized}
          x={isMobile ? 0 : w.x}
          y={isMobile ? 0 : w.y}
          w={isMobile ? viewportWidth : w.w}
          h={isMobile ? viewportHeight - taskbarHeight : w.h}
          maximized={isMobile ? true : w.maximized}
          resizable={!isMobile}
          originFor={() => origins.get(w.id) ?? null}
          minimizeTargetFor={() => taskbarButtonRect(w.id)}
          onFocus={() => windowManager.focus(w.id)}
          onMove={(x, y) => moveWindow(w.id, w.w, x, y)}
          onResize={(ww, hh) => windowManager.resize(w.id, ww, hh)}
          onMin={() => windowManager.minimize(w.id)}
          onMax={() => windowManager.toggleMax(w.id)}
          onClose={() => windowManager.close(w.id)}
        >
          {#if app.kind === "static"}
            {@html staticHtml[w.appId] ?? ""}
          {:else if svelteComponents[w.appId]}
            {@const AppComp = svelteComponents[w.appId]}
            <AppComp />
          {/if}
        </RetroWindow>
      {/if}
    {/each}

    <CrtLayer />

    {#if ctxMenu}
      <ContextMenu
        items={DESKTOP_MENU_ITEMS}
        x={ctxMenu.x}
        y={ctxMenu.y}
        onSelect={handleMenuSelect}
        onClose={() => (ctxMenu = null)}
      />
    {/if}
  </main>

  <Taskbar
    windows={wmState.windows}
    activeId={wmState.activeId}
    menuItems={START_MENU_ITEMS}
    mobile={isMobile}
    onToggleWindow={handleTaskbarToggle}
    onMenuSelect={handleStartSelect}
  />
{/if}
