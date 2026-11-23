<script lang="ts">
  import { tick } from "svelte";
  import { focusTargetFor, windowElement } from "@lib/os/focus";
  import { getOs } from "@lib/os/context";
  import { inTextField } from "@lib/os/keymap.svelte";
  import { clampWindowPosition, snapBox, snapZoneAt, unsnapX } from "@lib/window-bounds";
  import type { SnapZone } from "@lib/window-bounds";
  import RetroWindow from "@primitives/RetroWindow.svelte";
  import AppFrame from "./AppFrame.svelte";

  const { windows, launcher, keymap, boot, viewport } = getOs();

  function taskbarButtonRect(id: string): DOMRect | null {
    return document.querySelector(`[data-taskbar-window="${id}"]`)?.getBoundingClientRect() ?? null;
  }

  // ---- Snapping (desktop only; mobile windows are already full screen) ----
  let snapPreview = $state<SnapZone | null>(null);

  // Read live: a resize event may not have landed yet when a drag ends.
  function desktopArea() {
    return { width: window.innerWidth, height: window.innerHeight - viewport.taskbarHeight };
  }

  /** Dragging a snapped window out of its half gives it back its old size, under the pointer. */
  function handleDragStart(id: string, clientX: number) {
    const win = windows.get(id);
    if (win?.snapped) windows.restore(id, { x: unsnapX(clientX, win.box, win.floatingBox.w), y: win.box.y });
  }

  function handleDragMove(clientX: number, clientY: number) {
    snapPreview = viewport.mobile ? null : snapZoneAt(clientX, clientY, desktopArea());
  }

  function handleDragEnd(id: string, clientX: number, clientY: number) {
    snapPreview = null;
    if (viewport.mobile) return;
    const zone = snapZoneAt(clientX, clientY, desktopArea());
    if (zone === "max") windows.maximize(id);
    else if (zone) windows.snap(id, zone, desktopArea());
  }

  /** Arrow keys on a title bar, or Alt+Shift+arrow: snap left/right, maximise, restore. */
  function handleSnapKey(id: string, direction: "left" | "right" | "up" | "down") {
    if (!viewport.mobile) windows.snapKey(id, direction, desktopArea());
  }

  // Alt+Shift+arrow snaps the active window, unless focus is in a text field,
  // where that combination selects text on a Mac.
  const SNAP_KEYS = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down" } as const;
  $effect(() =>
    keymap.bind({
      id: "snap",
      keys: Object.keys(SNAP_KEYS).map((key) => `Alt+Shift+${key}`),
      scope: "window",
      description: "Snap the active window left or right, maximise, restore",
      when: (e) => boot.phase === "desktop" && windows.activeId !== null && !inTextField(e),
      run: (e) => handleSnapKey(windows.activeId ?? "", SNAP_KEYS[e.key as keyof typeof SNAP_KEYS]),
    }),
  );

  const previewBox = $derived.by(() => {
    if (!snapPreview) return null;
    const area = viewport.area;
    return snapPreview === "max" ? { x: 0, y: 0, w: area.width, h: area.height } : snapBox(snapPreview, area);
  });

  function moveWindow(id: string, width: number, x: number, y: number) {
    const next = clampWindowPosition(x, y, width, viewport.area);
    windows.move(id, next.x, next.y);
  }

  // ---- Focus ----
  // Set by a pointer press on a window's title bar or frame, not its body or
  // buttons. Only that focus is passed on: the app owns clicks in its body (the
  // Terminal lets them select text), and Tab onto the title bar must stay put.
  let pressedChrome = false;

  function handlePointerDown(e: PointerEvent) {
    const target = e.target as Element;
    pressedChrome = Boolean(target.closest("[data-window-id]")) && !target.closest("[data-window-body], button");
    // Focus from this press is dispatched in the same task; clear afterwards.
    window.setTimeout(() => (pressedChrome = false));
  }

  // The window manager remembers the last element focused in each window's
  // body. Header buttons aren't remembered; restoring onto "minimise" helps nobody.
  function handleFocusIn(e: FocusEvent) {
    const target = e.target as HTMLElement;
    const win = target.closest<HTMLElement>("[data-window-id]");
    if (!win) return;
    if (target.closest("[data-window-body]")) {
      windows.rememberFocus(win.dataset.windowId ?? "", target);
      return;
    }
    // A click on the title bar or edge: pass focus on to where the window was working.
    if (pressedChrome) {
      const next = focusTargetFor(windows, win);
      if (next !== win) next.focus({ preventScroll: true });
    }
  }

  // Keyboard focus follows the active window, so opening, restoring or
  // closing a window never strands focus on something that disappeared.
  let lastActiveId: string | null = null;
  $effect(() => {
    const id = windows.activeId;
    if (id === lastActiveId) return;
    lastActiveId = id;
    void tick().then(() => {
      const current = document.activeElement;
      if (id) {
        const win = windowElement(id);
        if (win && !win.contains(current)) focusTargetFor(windows, win).focus({ preventScroll: true });
      } else if (!current || current === document.body || current.closest("[data-window-id]")) {
        document.querySelector<HTMLElement>('nav[aria-label="Taskbar"] button')?.focus();
      }
    });
  });
</script>

<div class="contents" onpointerdowncapture={handlePointerDown} onfocusin={handleFocusIn}>
  {#each windows.windows as w (w.id)}
    {@const app = launcher.app(w.appId)}
    {#if app}
      {@const mobile = viewport.mobile}
      <RetroWindow
        id={w.id}
        title={w.title}
        icon={w.icon}
        active={windows.activeId === w.id}
        z={windows.z(w.id)}
        minimized={w.minimized}
        x={mobile ? 0 : w.box.x}
        y={mobile ? 0 : w.box.y}
        w={mobile ? viewport.width : w.box.w}
        h={mobile ? viewport.area.height : w.box.h}
        maximized={mobile || w.maximized}
        resizable={!mobile}
        originFor={() => launcher.origin(w.id)}
        minimizeTargetFor={() => taskbarButtonRect(w.id)}
        onFocus={() => windows.focus(w.id)}
        onDragStart={(x) => handleDragStart(w.id, x)}
        onDragMove={handleDragMove}
        onDragEnd={(x, y) => handleDragEnd(w.id, x, y)}
        onSnapKey={(direction) => handleSnapKey(w.id, direction)}
        onMove={(x, y) => moveWindow(w.id, w.box.w, x, y)}
        onResize={(ww, hh) => windows.resize(w.id, ww, hh)}
        onMin={() => windows.minimize(w.id)}
        onMax={() => windows.toggleMax(w.id)}
        onClose={() => windows.close(w.id)}
      >
        <AppFrame appId={w.appId} title={w.title} onClose={() => windows.close(w.id)}>
          {#if app.kind === "static"}
            {@html launcher.html(w.appId)}
          {:else}
            {@const AppComponent = launcher.component(w.appId)}
            <AppComponent shell={launcher.shellFor(w.id)} />
          {/if}
        </AppFrame>
      </RetroWindow>
    {/if}
  {/each}
</div>

{#if previewBox}
  <!-- Just under the dragged (top) window, above the rest. -->
  <div
    class="snap-preview pointer-events-none absolute"
    style:z-index={windows.topZ - 1}
    style:left="{previewBox.x}px"
    style:top="{previewBox.y}px"
    style:width="{previewBox.w}px"
    style:height="{previewBox.h}px"
    aria-hidden="true"
    data-snap-preview={snapPreview}
  ></div>
{/if}
