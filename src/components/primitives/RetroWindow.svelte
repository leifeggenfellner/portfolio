<script lang="ts">
  import { cx } from "@lib/cx";
  import WindowHeader from "./WindowHeader.svelte";
  import type { Snippet } from "svelte";

  interface Props {
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
    onFocus?: () => void;
    onMove?: (x: number, y: number) => void;
    onResize?: (w: number, h: number) => void;
    onMin?: () => void;
    onMax?: () => void;
    onClose?: () => void;
  }

  let {
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
    onFocus,
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
  }

  function stopDrag() {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", stopDrag);
  }

  function startDrag(e: PointerEvent) {
    if (maximized) return;

    onFocus?.();

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

  const outerClass = [
    "bevel-out absolute flex flex-col p-0.75 bg-surface",
    "[animation:win-open_var(--duration-2)_var(--ease-out)]",
  ].join(" ");

  const frameStyle = $derived(
    maximized
      ? `left:0;top:0;width:100%;height:calc(100% - 2px);z-index:${z};`
      : `left:${x}px;top:${y}px;width:${w}px;${h ? `height:${h}px;` : ""}z-index:${z};`,
  );

  const shadowClass = $derived(active ? "shadow-window" : "[box-shadow:2px_2px_0_rgba(0,0,0,.18)]");
</script>

{#if !minimized}
  <div
    bind:this={winRef}
    role="dialog"
    aria-label={title}
    class={cx(outerClass, shadowClass)}
    style={frameStyle}
    tabindex="-1"
    onpointerdown={() => onFocus?.()}
  >
    {#if !noChrome}
      <WindowHeader {icon} {title} {active} {maximized} onPointerDown={startDrag} {onMin} {onMax} {onClose} />
    {/if}
    <div
      class={cx(
        "bevel-in retro-scroll bg-surface-3 flex min-h-0 flex-1 flex-col overflow-hidden",
        !noChrome && "mt-0.5",
      )}
    >
      {@render children?.()}
    </div>
    {#if statusbar}
      <div class="bevel-in-thin bg-surface text-12 text-text-dim mt-0.75 flex gap-3.5 px-1.5 py-0.5">
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
