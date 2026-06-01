<script lang="ts">
  import type { Component } from "svelte";
  import { onMount } from "svelte";
  import { APPS } from "@apps/registry.svelte";
  import BootSequence from "@effects/BootSequence.svelte";
  import CrtLayer from "@effects/CrtLayer.svelte";
  import LoadingSplash from "@effects/LoadingSplash.svelte";
  import Wallpaper from "@effects/Wallpaper.svelte";
  import { cx } from "@lib/cx";
  import { windowManager } from "@lib/store/window-manager";
  import ContextMenu from "@primitives/ContextMenu.svelte";
  import type { MenuEntry } from "@primitives/ContextMenu.svelte";
  import RetroWindow from "@primitives/RetroWindow.svelte";

  const MOBILE_QUERY = "(max-width: 768px)";
  const MOBILE_TASKBAR_OFFSET = 56;
  const MIN_LOADING_MS = 800;

  const MAIN_CLASS = "relative h-screen w-screen overflow-hidden bg-desktop";
  const ICON_GRID_BASE = "absolute top-4 z-(--z-desktop)";
  const ICON_GRID_DESKTOP = "left-4 flex flex-col gap-3";
  const ICON_GRID_MOBILE = "left-3 right-3 grid grid-cols-4 gap-3";
  const ICON_BUTTON_BASE = "focus-ring icon-label text-12 flex flex-col items-center gap-1 p-1 text-white";
  const ICON_BUTTON_DESKTOP = "w-19";
  const ICON_BUTTON_MOBILE = "w-full";
  const ICON_IMG_CLASS = "icon-glow h-6 w-6 object-contain";
  const SYS_BADGE_CLASS = [
    "pointer-events-none absolute top-3.5 right-4 z-(--z-desktop)",
    "text-right text-white/85",
    "[text-shadow:0_0_14px_color-mix(in_srgb,var(--magenta)_60%,transparent)]",
  ].join(" ");

  let ready = $state(false);
  let booted = $state(false);
  let isMobile = $state(false);
  let themeLabel = $state("LIGHT");
  let viewportWidth = $state(0);
  let viewportHeight = $state(0);

  let wmState = $state(windowManager.get());
  let svelteComponents = $state<Record<string, Component>>({});
  let staticHtml = $state<Record<string, string>>({});

  // Context menu state
  let ctxMenu = $state<{ x: number; y: number } | null>(null);

  const DESKTOP_MENU_ITEMS = $derived<MenuEntry[]>([
    ...APPS.map((a) => ({ id: `open:${a.id}`, label: a.title, icon: "pixelarticons:folder" })),
    { separator: true as const },
    {
      id: "theme:toggle",
      label: themeLabel === "DARK" ? "Light Theme" : "Dark Theme",
      icon: themeLabel === "DARK" ? "lucide:sun" : "lucide:moon",
    },
    { id: "cascade", label: "Cascade Windows", icon: "pixelarticons:layout" },
  ]);

  function handleDesktopContext(e: MouseEvent) {
    e.preventDefault();
    ctxMenu = { x: e.clientX, y: e.clientY };
  }

  function handleMenuSelect(id: string) {
    if (id.startsWith("open:")) {
      void launch(id.replace("open:", ""));
    } else if (id === "theme:toggle") {
      const html = document.documentElement;
      const current = html.getAttribute("data-theme");
      html.setAttribute("data-theme", current === "dark" ? "light" : "dark");
      themeLabel = (html.getAttribute("data-theme") ?? "light").toUpperCase();
    } else if (id === "cascade") {
      windowManager.cascade();
    }
  }

  function syncViewport() {
    isMobile = window.matchMedia(MOBILE_QUERY).matches;
    themeLabel = (document.documentElement.getAttribute("data-theme") ?? "light").toUpperCase();
    viewportWidth = window.innerWidth;
    viewportHeight = window.innerHeight;
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

  async function launch(appId: string) {
    const app = APPS.find((a) => a.id === appId);
    if (!app) return;
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

  function handleIconClick(appId: string) {
    if (!isMobile) return;
    void launch(appId);
  }

  function handleIconDoubleClick(appId: string) {
    void launch(appId);
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

  // Minimum splash duration, then show boot sequence.
  onMount(() => {
    const t = window.setTimeout(() => {
      ready = true;
    }, MIN_LOADING_MS);

    return () => {
      window.clearTimeout(t);
    };
  });
</script>

{#if !ready}
  <LoadingSplash />
{:else if !booted}
  <BootSequence onDone={() => (booted = true)} />
{:else}
  <main class={MAIN_CLASS} oncontextmenu={handleDesktopContext}>
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

    <ul class={cx(ICON_GRID_BASE, isMobile ? ICON_GRID_MOBILE : ICON_GRID_DESKTOP)}>
      {#each APPS as a (a.id)}
        <li>
          <button
            type="button"
            ondblclick={() => handleIconDoubleClick(a.id)}
            onclick={() => handleIconClick(a.id)}
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

    {#each wmState.windows as w (w.id)}
      {@const app = APPS.find((a) => a.id === w.appId)}
      {#if app}
        <RetroWindow
          title={w.title}
          icon={w.icon}
          active={wmState.activeId === w.id}
          z={w.z}
          minimized={w.minimized}
          x={isMobile ? 0 : w.x}
          y={isMobile ? 0 : w.y}
          w={isMobile ? viewportWidth : w.w}
          h={isMobile ? viewportHeight - MOBILE_TASKBAR_OFFSET : w.h}
          maximized={isMobile ? true : w.maximized}
          resizable={!isMobile}
          onFocus={() => windowManager.focus(w.id)}
          onMove={(x, y) => windowManager.move(w.id, x, y)}
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
{/if}
