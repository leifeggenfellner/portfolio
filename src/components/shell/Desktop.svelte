<script lang="ts">
  import type { Component } from "svelte";
  import { onMount, tick } from "svelte";
  import { APPS } from "@apps/registry.svelte";
  import BootSequence from "@effects/BootSequence.svelte";
  import CrtLayer from "@effects/CrtLayer.svelte";
  import LoadingSplash from "@effects/LoadingSplash.svelte";
  import Screensaver from "@effects/Screensaver.svelte";
  import Wallpaper from "@effects/Wallpaper.svelte";
  import type { AppProps, AppShell } from "@lib/app-shell";
  import { APP_VERSION, BUILD_DATE } from "@lib/build-info";
  import { FIRST_SPLASH_MS, hasVisited, markVisited, RETURN_SPLASH_MS } from "@lib/boot";
  import { degauss } from "@lib/degauss";
  import { isDrafting, watchIdle } from "@lib/idle";
  import { durationMs, prefersReducedMotion } from "@lib/motion";
  import { dismissHelpNote, isHelpNoteDismissed } from "@lib/help-note";
  import { applySettingsToRoot, screensaverDelayMs } from "@lib/settings";
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

  // pending: server render and pre-hydration (a dark power-on screen)
  // bios → splash → leaving → desktop on a first visit; splash onward when returning.
  type BootPhase = "pending" | "bios" | "splash" | "leaving" | "desktop";
  let phase = $state<BootPhase>("pending");
  let returning = $state(false);
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
  let mainEl = $state<HTMLElement>();
  let degaussRing = $state<HTMLElement>();
  let lastTheme: Settings["theme"] | null = null;
  let screensaverOn = $state(false);

  // Where each window should grow from next time it appears: the icon or
  // taskbar button that summoned it. Read once by the window's intro.
  const origins = new Map<string, DOMRect>();

  let wmState = $state(windowManager.get());
  let svelteComponents = $state<Record<string, Component<AppProps>>>({});
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

  async function ensureSvelteLoaded(appId: string, load: () => Promise<{ default: Component<AppProps> }>) {
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

  // One shell per window, so apps receive a stable prop.
  const APP_LIST = APPS.map((a) => ({ id: a.id, title: a.title, icon: a.icon }));
  const shells = new Map<string, AppShell>();
  function shellFor(windowId: string): AppShell {
    let shell = shells.get(windowId);
    if (!shell) {
      shell = {
        apps: APP_LIST,
        open: (appId) => void launch(appId),
        close: () => windowManager.close(windowId),
      };
      shells.set(windowId, shell);
    }
    return shell;
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
    // Degauss on a theme switch, but not when settings first load.
    if (lastTheme && lastTheme !== prefs.theme && mainEl && degaussRing) void degauss(mainEl, degaussRing);
    lastTheme = prefs.theme;
  });

  // Screensaver: only on the desktop, and never over a half-written draft.
  $effect(() => {
    const timeoutMs = screensaverDelayMs(prefs.screensaver);
    if (timeoutMs === null || phase !== "desktop") return;
    // The key that wakes the screen is swallowed, as on a real machine, so it
    // can't also close a window or type into the terminal. Registered before
    // the idle watcher so it still sees the screensaver as on.
    const swallow = (e: KeyboardEvent) => {
      if (!screensaverOn) return;
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener("keydown", swallow, { capture: true });
    const stop = watchIdle({
      timeoutMs,
      onIdle: () => (screensaverOn = true),
      onActive: () => (screensaverOn = false),
      canIdle: () => !isDrafting(),
    });
    return () => {
      stop();
      window.removeEventListener("keydown", swallow, { capture: true });
      screensaverOn = false;
    };
  });

  function finishBoot() {
    markVisited();
    phase = "desktop";
  }

  // The splash fades over the already-mounted desktop. Removal is timed, not
  // tied to the fade finishing, so a starved animation can never leave the
  // boot screen covering the desktop.
  function leaveSplash() {
    if (phase !== "splash") return;
    phase = "leaving";
    window.setTimeout(finishBoot, prefersReducedMotion() ? 0 : durationMs("--dur-3", 240));
  }

  onMount(() => {
    settings.hydrate();
    prefs = settings.get();
    settingsReady = true;
    helpNoteOpen = !isHelpNoteDismissed();

    if (!settings.get().bootAnimation) {
      finishBoot();
      return;
    }
    returning = hasVisited();
    phase = returning ? "splash" : "bios";

    // One skip handler for every boot phase, so a key pressed at any point
    // lands on the desktop instead of advancing to the next phase.
    const onSkipKey = (e: KeyboardEvent) => {
      if (phase === "desktop" || !["Escape", "Enter", " "].includes(e.key)) return;
      e.preventDefault();
      finishBoot();
    };
    window.addEventListener("keydown", onSkipKey);
    return () => window.removeEventListener("keydown", onSkipKey);
  });
</script>

{#if phase === "pending"}
  <div class="bg-boot-bg fixed inset-0 z-(--z-boot)" aria-hidden="true"></div>
{:else if phase === "bios"}
  <BootSequence onDone={() => (phase = "splash")} onSkip={finishBoot} />
{/if}

{#if phase === "splash" || phase === "leaving"}
  <LoadingSplash
    durationMs={returning ? RETURN_SPLASH_MS : FIRST_SPLASH_MS}
    sunRise={!returning}
    leaving={phase === "leaving"}
    onDone={leaveSplash}
  />
{/if}

<!-- The desktop mounts under the splash so the splash can dissolve into it. -->
{#if phase === "splash" || phase === "leaving" || phase === "desktop"}
  <main
    bind:this={mainEl}
    class={MAIN_CLASS}
    inert={phase !== "desktop"}
    oncontextmenu={handleDesktopContext}
    onpointerdown={handleDesktopPointerDown}
  >
    <Wallpaper />
    {#if !isMobile}
      <aside class={SYS_BADGE_CLASS} aria-label="System information">
        <p class="font-chrome text-[28px] leading-none tracking-[0.02em]">
          RETRO<span class="text-cyan">//OS</span>
        </p>
        <p class="font-mono mt-1 text-[13px] opacity-80">v{APP_VERSION} · {themeLabel}</p>
        <p class="font-mono text-[12px] opacity-70">build {BUILD_DATE}</p>
      </aside>
    {/if}

    <ul
      bind:this={iconList}
      aria-label="Desktop"
      class={cx(ICON_GRID_BASE, isMobile ? ICON_GRID_MOBILE : ICON_GRID_DESKTOP)}
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
            onkeydown={handleIconKeydown}
            class={cx(ICON_BUTTON_BASE, isMobile ? ICON_BUTTON_MOBILE : ICON_BUTTON_DESKTOP)}
          >
            <img
              src={a.icon}
              alt=""
              aria-hidden="true"
              class={ICON_IMG_CLASS}
              width="32"
              height="32"
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
            <AppComp shell={shellFor(w.id)} />
          {/if}
        </RetroWindow>
      {/if}
    {/each}

    <CrtLayer />
    <div bind:this={degaussRing} class="degauss-ring" aria-hidden="true"></div>

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

  <div class="contents" inert={phase !== "desktop"}>
    <Taskbar
      windows={wmState.windows}
      activeId={wmState.activeId}
      menuItems={START_MENU_ITEMS}
      mobile={isMobile}
      onToggleWindow={handleTaskbarToggle}
      onMenuSelect={handleStartSelect}
    />
  </div>

  {#if screensaverOn}
    <Screensaver />
  {/if}
{/if}
