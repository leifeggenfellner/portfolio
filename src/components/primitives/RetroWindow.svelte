<script lang="ts">
  import { cx } from "@lib/cx";
  import { durationMs, easing, prefersReducedMotion } from "@lib/motion";
  import { tick } from "svelte";
  import { expoOut } from "svelte/easing";
  import WindowHeader from "./WindowHeader.svelte";
  import type { Snippet } from "svelte";
  import type { TransitionConfig } from "svelte/transition";

  interface Props {
    id: string;
    title: string;
    icon?: string;
    children: Snippet;
    active?: boolean;
    x?: number;
    y?: number;
    w?: number;
    h?: number;
    z?: number;
    minimized?: boolean;
    maximized?: boolean;
    resizable?: boolean;
    noChrome?: boolean;
    statusbar?: Snippet;
    /** Where the window should grow from when it appears (launching icon, taskbar button). */
    originFor?: () => DOMRect | null;
    /** Where the window should shrink to when minimised (its taskbar button). */
    minimizeTargetFor?: () => DOMRect | null;
    onFocus?: () => void;
    /** A title-bar drag starts, at this pointer position; called before the window's position is read. */
    onDragStart?: (clientX: number, clientY: number) => void;
    /** The pointer moved during a title-bar drag. */
    onDragMove?: (clientX: number, clientY: number) => void;
    /** A title-bar drag ended here. */
    onDragEnd?: (clientX: number, clientY: number) => void;
    /** Arrow keys on the focused title bar: snap left or right, maximise, or restore. */
    onSnapKey?: (direction: "left" | "right" | "up" | "down") => void;
    onMove?: (x: number, y: number) => void;
    onResize?: (w: number, h: number) => void;
    onMin?: () => void;
    onMax?: () => void;
    onClose?: () => void;
  }

  let {
    id,
    title,
    icon,
    children,
    active = true,
    x = 40,
    y = 40,
    w = 420,
    h,
    z = 100,
    minimized,
    maximized,
    resizable = true,
    noChrome,
    statusbar,
    originFor,
    minimizeTargetFor,
    onFocus,
    onDragStart,
    onDragMove,
    onDragEnd,
    onSnapKey,
    onMove,
    onResize,
    onMin,
    onMax,
    onClose,
  }: Props = $props();

  let winRef = $state<HTMLDivElement | undefined>(undefined);

  // -------------------------
  // Drag
  // -------------------------
  let dragStartX = 0;
  let dragStartY = 0;
  let baseX = 0;
  let baseY = 0;

  function move(e: PointerEvent) {
    onMove?.(baseX + (e.clientX - dragStartX), Math.max(0, baseY + (e.clientY - dragStartY)));
    onDragMove?.(e.clientX, e.clientY);
  }

  function stopDrag(e: PointerEvent) {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", stopDrag);
    onDragEnd?.(e.clientX, e.clientY);
  }

  function startDrag(e: PointerEvent) {
    if (maximized) return;

    onFocus?.();
    // May resize or move the window (unsnapping it), so read x and y after.
    onDragStart?.(e.clientX, e.clientY);

    dragStartX = e.clientX;
    dragStartY = e.clientY;
    baseX = x;
    baseY = y;

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stopDrag, { once: true });
  }

  // -------------------------
  // Resize
  // -------------------------
  let startWidth = 0;
  let startHeight = 0;
  let startX = 0;
  let startY = 0;

  function resizeMove(e: PointerEvent) {
    onResize?.(Math.max(260, startWidth + (e.clientX - startX)), Math.max(160, startHeight + (e.clientY - startY)));
  }

  function stopResize() {
    window.removeEventListener("pointermove", resizeMove);
    window.removeEventListener("pointerup", stopResize);
  }

  function startResize(e: PointerEvent) {
    e.stopPropagation();
    onFocus?.();

    if (!winRef) return;

    startX = e.clientX;
    startY = e.clientY;

    startWidth = winRef.offsetWidth;
    startHeight = winRef.offsetHeight;

    window.addEventListener("pointermove", resizeMove);
    window.addEventListener("pointerup", stopResize, { once: true });
  }

  // -------------------------
  // Motion
  // -------------------------
  // Offset and scale that map this window's box onto another rect, measured
  // from the window centre (the default transform-origin).
  function towards(node: Element, rect: DOMRect | null | undefined) {
    const box = node.getBoundingClientRect();
    if (!rect || box.width === 0) return { dx: 0, dy: 6, scale: 0.96 };
    return {
      dx: rect.x + rect.width / 2 - (box.x + box.width / 2),
      dy: rect.y + rect.height / 2 - (box.y + box.height / 2),
      scale: Math.min(0.9, Math.max(0.3, rect.width / box.width)),
    };
  }

  // Grow out of the icon or taskbar button that opened the window.
  function windowIn(node: Element): TransitionConfig {
    if (prefersReducedMotion()) return { duration: 0 };
    const { dx, dy, scale } = towards(node, originFor?.());
    return {
      duration: durationMs("--dur-3", 240),
      easing: expoOut,
      css: (t, u) =>
        `transform: translate(${dx * u}px, ${dy * u}px) scale(${scale + (1 - scale) * t}); opacity: ${Math.min(1, t * 2)};`,
    };
  }

  // Exits are faster than entrances: shrink into the taskbar when minimised,
  // otherwise a short fade and settle.
  function windowOut(node: Element): TransitionConfig {
    if (prefersReducedMotion()) return { duration: 0 };
    const toTaskbar = minimized ? minimizeTargetFor?.() : null;
    const { dx, dy, scale } = toTaskbar ? towards(node, toTaskbar) : { dx: 0, dy: 0, scale: 0.97 };
    return {
      duration: durationMs("--dur-2", 160),
      easing: expoOut,
      css: (t, u) => `transform: translate(${dx * u}px, ${dy * u}px) scale(${scale + (1 - scale) * t}); opacity: ${t};`,
    };
  }

  // Maximise and restore animate the frame from its old box to its new one
  // (FLIP), so the layout change itself stays a single style update.
  let lastMaximized: boolean | undefined;
  $effect.pre(() => {
    const next = Boolean(maximized);
    if (lastMaximized === undefined || lastMaximized === next) {
      lastMaximized = next;
      return;
    }
    lastMaximized = next;
    if (!winRef || prefersReducedMotion()) return;
    const node = winRef;
    const first = node.getBoundingClientRect();
    void tick().then(() => {
      const last = node.getBoundingClientRect();
      if (!last.width || !last.height) return;
      node.animate(
        [
          {
            transformOrigin: "top left",
            transform: `translate(${first.left - last.left}px, ${first.top - last.top}px) scale(${first.width / last.width}, ${first.height / last.height})`,
          },
          { transformOrigin: "top left", transform: "none" },
        ],
        { duration: durationMs("--dur-3", 240), easing: easing("--ease-out") },
      );
    });
  });

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape" && !e.defaultPrevented && onClose) {
      e.preventDefault();
      onClose();
    }
  }

  const outerClass = "bevel-out focus-ring absolute flex flex-col p-0.75 bg-surface";

  const frameStyle = $derived(
    maximized
      ? `left:0;top:0;width:100%;height:calc(100% - var(--taskbar-height));z-index:${z};`
      : `left:${x}px;top:${y}px;width:${w}px;${h ? `height:${h}px;` : ""}z-index:${z};`,
  );

  const shadowClass = $derived(active ? "shadow-window" : "window-shadow-inactive");
</script>

{#if !minimized}
  <div
    bind:this={winRef}
    role="dialog"
    aria-label={title}
    data-window-id={id}
    class={cx(outerClass, shadowClass)}
    style={frameStyle}
    tabindex="-1"
    onpointerdown={() => onFocus?.()}
    onkeydown={handleKeydown}
    in:windowIn|global
    out:windowOut|global
  >
    {#if !noChrome}
      <WindowHeader
        {icon}
        {title}
        {active}
        {maximized}
        onPointerDown={startDrag}
        onArrowKey={onSnapKey}
        {onMin}
        {onMax}
        {onClose}
      />
    {/if}
    <div
      data-window-body
      class={cx(
        "bevel-in retro-scroll bg-surface-3 flex min-h-0 flex-1 flex-col overflow-hidden",
        !noChrome && "mt-0.5",
      )}
    >
      {@render children?.()}
    </div>
    {#if statusbar}
      <div class="bevel-in-thin bg-surface text-12 text-text mt-0.75 flex gap-3.5 px-1.5 py-0.5">
        {@render statusbar?.()}
      </div>
    {/if}

    {#if resizable && !maximized}
      <button
        type="button"
        aria-label="Resize window"
        onpointerdown={startResize}
        class="absolute right-0 bottom-0 h-4 w-4 cursor-nwse-resize border-0 bg-transparent p-0 bg-[repeating-linear-gradient(135deg,var(--bevel-shadow)_0_1px,transparent_1px_3px)]"
      ></button>
    {/if}
  </div>
{/if}
