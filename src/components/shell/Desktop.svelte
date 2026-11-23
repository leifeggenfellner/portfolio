<script lang="ts">
  import { onMount, tick } from "svelte";
  import BootSequence from "@effects/BootSequence.svelte";
  import CrtLayer from "@effects/CrtLayer.svelte";
  import LoadingSplash from "@effects/LoadingSplash.svelte";
  import Wallpaper from "@effects/Wallpaper.svelte";
  import { FIRST_SPLASH_MS, RETURN_SPLASH_MS } from "@lib/boot";
  import { degauss } from "@lib/degauss";
  import { dismissHelpNote, isHelpNoteDismissed } from "@lib/help-note";
  import { wallpaperCovered } from "@lib/horizon";
  import { durationMs, prefersReducedMotion } from "@lib/motion";
  import { getOs } from "@lib/os/context";
  import { bindingFor } from "@lib/os/shortcuts";
  import { applySettingsToRoot } from "@lib/settings";
  import type { Theme } from "@lib/settings";
  import DesktopIcons from "./DesktopIcons.svelte";
  import DesktopMenu from "./DesktopMenu.svelte";
  import HelpNote from "./HelpNote.svelte";
  import PaletteHost from "./PaletteHost.svelte";
  import ScreensaverHost from "./ScreensaverHost.svelte";
  import type { StartMenuItem } from "./StartMenu.svelte";
  import SystemBadge from "./SystemBadge.svelte";
  import Taskbar from "./Taskbar.svelte";
  import WindowLayer from "./WindowLayer.svelte";

  interface Props {
    /** Opened at an app route: straight to the desktop, no boot sequence. */
    deepLink?: boolean;
  }

  let { deepLink = false }: Props = $props();

  const { windows, settings, keymap, boot, viewport, launcher, announcer } = getOs();

  let icons = $state<ReturnType<typeof DesktopIcons>>();
  let menu = $state<ReturnType<typeof DesktopMenu>>();
  let palette = $state<ReturnType<typeof PaletteHost>>();
  let helpNote = $state<ReturnType<typeof HelpNote>>();
  let helpNoteOpen = $state(false);
  let screensaverOn = $state(false);
  let settingsReady = $state(false);
  let mainEl = $state<HTMLElement>();
  let degaussRing = $state<HTMLElement>();
  let lastTheme: Theme | null = null;

  const START_MENU_ITEMS: StartMenuItem[] = [
    ...launcher.apps.map((a) => ({ id: `open:${a.id}`, label: a.title, image: a.icon })),
    { id: "help", label: "Help", icon: "pixelarticons:info-box", separatorBefore: true },
    { id: "palette", label: "Command palette  Ctrl+K", icon: "pixelarticons:search" },
  ];

  function handleStartSelect(id: string, origin: DOMRect) {
    if (id.startsWith("open:")) void launcher.open(id.slice("open:".length), { origin });
    else if (id === "help") void showHelpNote();
    else if (id === "palette") void palette?.open();
  }

  function handleTaskbarToggle(id: string) {
    const button = document.querySelector<HTMLElement>(`[data-taskbar-window="${id}"]`);
    if (button) launcher.setOrigin(id, button.getBoundingClientRect());
    windows.toggleFromTaskbar(id);
  }

  async function showHelpNote() {
    helpNoteOpen = true;
    await tick();
    helpNote?.focus();
  }

  function closeHelpNote() {
    dismissHelpNote();
    helpNoteOpen = false;
    icons?.focusFirst();
  }

  $effect(() => {
    if (!settingsReady) return;
    const prefs = settings.current;
    applySettingsToRoot(document.documentElement, prefs);
    // Degauss on a theme switch, but not when settings first load.
    if (lastTheme && lastTheme !== prefs.theme) {
      announcer.announce(`${prefs.theme === "dark" ? "Dark" : "Light"} theme`);
      if (mainEl && degaussRing) void degauss(mainEl, degaussRing);
    }
    lastTheme = prefs.theme;
  });

  // One skip binding for every boot phase, so a key pressed at any point
  // lands on the desktop instead of advancing to the next phase.
  $effect(() => {
    if (!boot.running) return;
    return keymap.bind({
      ...bindingFor("bootSkip"),
      run: () => boot.finish(),
    });
  });

  // The inline bootstrap script covers the server-rendered desktop when a
  // boot is about to play (see RootLayout); the boot screens take over from it.
  $effect(() => {
    if (boot.phase !== "pending") delete document.documentElement.dataset.boot;
  });

  // The splash fades over the already-mounted desktop; Boot removes it on a timer.
  function leaveSplash() {
    boot.leaveSplash(prefersReducedMotion() ? 0 : durationMs("--dur-3", 240));
  }

  onMount(() => {
    settings.hydrate();
    settingsReady = true;
    helpNoteOpen = !isHelpNoteDismissed();
    boot.start(settings.current.bootAnimation && !deepLink);
  });
</script>

{#if boot.phase === "pending"}
  <!-- Hidden unless the bootstrap script says a boot will play; never covers the page without JS. -->
  <div class="boot-cover bg-boot-bg fixed inset-0 z-(--z-boot)" aria-hidden="true"></div>
{:else if boot.phase === "bios"}
  <BootSequence onDone={() => boot.biosDone()} onSkip={() => boot.finish()} />
{/if}

{#if boot.phase === "splash" || boot.phase === "leaving"}
  <LoadingSplash
    durationMs={boot.returning ? RETURN_SPLASH_MS : FIRST_SPLASH_MS}
    sunRise={!boot.returning}
    leaving={boot.phase === "leaving"}
    onDone={leaveSplash}
  />
{/if}

<!-- Server-rendered, so it works without JS; the boot screens play over it. -->
<main
  bind:this={mainEl}
  class="bg-desktop relative h-screen w-screen overflow-hidden"
  inert={boot.running}
  aria-busy={launcher.loading > 0 || undefined}
  oncontextmenu={(e) => menu?.openAt(e)}
>
  <!-- Paused under the BIOS: it can't be seen, and a throttled phone needs the CPU for the boot. -->
  <Wallpaper covered={boot.phase === "bios" || screensaverOn || wallpaperCovered(windows.windows, viewport.mobile)} />
  <SystemBadge />
  <DesktopIcons bind:this={icons} />
  <!-- After the boot: nothing under the boot screens should fetch or paint first. -->
  {#if helpNoteOpen && boot.phase === "desktop"}
    <HelpNote bind:this={helpNote} mobile={viewport.mobile} onDismiss={closeHelpNote} />
  {/if}
  <WindowLayer />
  <CrtLayer />
  <div bind:this={degaussRing} class="degauss-ring" aria-hidden="true"></div>
  <DesktopMenu bind:this={menu} />
</main>

<div class="contents" inert={boot.running}>
  <Taskbar
    windows={windows.windows}
    activeId={windows.activeId}
    menuItems={START_MENU_ITEMS}
    onToggleWindow={handleTaskbarToggle}
    onMenuSelect={handleStartSelect}
  />
</div>

<!-- The desktop's one live region (see the Announcer in src/lib/os). -->
<p class="sr-only" aria-live="polite" aria-atomic="true" data-announcer>{announcer.message}</p>

<PaletteHost bind:this={palette} />
<ScreensaverHost bind:on={screensaverOn} />

<style>
  /* ---- degauss ring: colour fringing that sweeps out on a theme switch ---- */
  .degauss-ring {
    position: fixed;
    inset: -25vmax;
    z-index: var(--z-crt);
    pointer-events: none;
    opacity: 0;
    mix-blend-mode: screen;
    background: radial-gradient(
      circle,
      transparent 28%,
      color-mix(in srgb, var(--magenta) 55%, transparent) 36%,
      color-mix(in srgb, var(--cyan) 55%, transparent) 42%,
      color-mix(in srgb, var(--accent) 40%, transparent) 47%,
      transparent 54%
    );
  }

  /* ---- boot cover ----
     Server-rendered with the desktop but hidden; the inline bootstrap script
     shows it (html[data-boot="pending"]) only when a boot sequence will play,
     so the desktop never flashes before the BIOS and never hides without JS. */
  .boot-cover {
    display: none;
  }

  :global(:root[data-boot="pending"]) .boot-cover {
    display: block;
  }
</style>
