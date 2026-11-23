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

  const { windows, settings, keymap, boot, viewport, launcher } = getOs();

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
    ...launcher.apps.map((a) => ({ id: `open:${a.id}`, label: a.title, icon: a.icon })),
    { id: "help", label: "Help", icon: "pixelarticons:info-box", iconify: true, separatorBefore: true },
    { id: "palette", label: "Command palette  Ctrl+K", icon: "pixelarticons:search", iconify: true },
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
    if (lastTheme && lastTheme !== prefs.theme && mainEl && degaussRing) void degauss(mainEl, degaussRing);
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
  <Wallpaper covered={screensaverOn || wallpaperCovered(windows.windows, viewport.mobile)} />
  {#if !viewport.mobile}
    <SystemBadge />
  {/if}
  <DesktopIcons bind:this={icons} />
  {#if helpNoteOpen}
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
    mobile={viewport.mobile}
    onToggleWindow={handleTaskbarToggle}
    onMenuSelect={handleStartSelect}
  />
</div>

<PaletteHost bind:this={palette} />
<ScreensaverHost bind:on={screensaverOn} />
