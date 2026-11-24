<script lang="ts">
  import Icon from "./Icon.svelte";
  import RetroButton from "./RetroButton.svelte";

  interface Props {
    icon?: string;
    title: string;
    active?: boolean;
    maximized?: boolean;
    onPointerDown?: (e: PointerEvent) => void;
    /** Arrow keys while the title bar itself has focus. */
    onArrowKey?: (direction: "left" | "right" | "up" | "down") => void;
    onMin?: () => void;
    onMax?: () => void;
    onClose?: () => void;
  }

  let { icon, title, active = true, maximized, onPointerDown, onArrowKey, onMin, onMax, onClose }: Props = $props();

  const ARROWS = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down" } as const;

  function handleKeydown(e: KeyboardEvent) {
    // Only the title bar itself; its buttons keep their own keys.
    if (e.target !== e.currentTarget || !onArrowKey || e.altKey || e.ctrlKey || e.metaKey) return;
    const direction = ARROWS[e.key as keyof typeof ARROWS];
    if (!direction) return;
    e.preventDefault();
    onArrowKey(direction);
  }

  const headerClass = [
    "group no-select font-chrome flex h-7 cursor-move items-center gap-1.5 px-1 py-0.75 pl-1.5 pointer-coarse:h-12",
    "title-bar-inactive data-[active=true]:title-bar",
    // A tab stop (arrows snap); the ring takes the bar's text colour to show on the gradient.
    "focus-ring [--focus-ring-color:currentColor]",
  ].join(" ");

  const iconClass = [
    "h-4 w-4 object-contain",
    "grayscale opacity-60",
    "group-data-[active=true]:grayscale-0 group-data-[active=true]:opacity-100",
  ].join(" ");

  const iconWrapClass = ["bevel-in title-icon flex h-5 w-5 shrink-0 items-center justify-center"].join(" ");

  const titleClass = [
    "text-15 flex-1 overflow-hidden text-ellipsis whitespace-nowrap",
    "group-data-[active=true]:title-text-shadow",
  ].join(" ");

  // Touch screens get 44px targets; a mouse keeps the period-sized buttons.
  const sysBtnClass = "w-5.5 h-5 text-sm font-bold text-text pointer-coarse:h-10 pointer-coarse:w-11";
</script>

<div
  class={headerClass}
  role="toolbar"
  aria-label="Window header"
  data-active={active}
  tabindex="0"
  aria-keyshortcuts={onArrowKey ? "ArrowLeft ArrowRight ArrowUp ArrowDown" : undefined}
  onpointerdown={onPointerDown}
  onkeydown={handleKeydown}
  ondblclick={() => onMax?.()}
>
  {#if icon}
    <span class={iconWrapClass} aria-hidden="true">
      <img src={icon} alt="" class={iconClass} width="16" height="16" loading="lazy" decoding="async" />
    </span>
  {/if}
  <span class={titleClass}>{title}</span>
  <div
    class="flex gap-0.75 pointer-coarse:gap-1.5"
    role="group"
    aria-label="Window controls"
    onpointerdown={(e) => e.stopPropagation()}
  >
    {#if onMin}
      <RetroButton variant="icon" class={sysBtnClass} aria-label="Minimize" title="Minimize" onclick={onMin}>
        <Icon icon="ui:minimize" />
      </RetroButton>
    {/if}
    {#if onMax}
      <RetroButton
        variant="icon"
        class={sysBtnClass}
        aria-label={maximized ? "Restore" : "Maximize"}
        title={maximized ? "Restore" : "Maximize"}
        onclick={onMax}
      >
        <Icon icon={maximized ? "pixelarticons:card-stack" : "pixelarticons:card-sharp"} />
      </RetroButton>
    {/if}
    {#if onClose}
      <RetroButton variant="icon" class={sysBtnClass} aria-label="Close" title="Close" onclick={onClose}>
        <Icon icon="pixelarticons:close" />
      </RetroButton>
    {/if}
  </div>
</div>
