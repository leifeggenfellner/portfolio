<script lang="ts">
  import Icon from "@iconify/svelte";
  import RetroButton from "./RetroButton.svelte";

  interface Props {
    icon?: string;
    title: string;
    active?: boolean;
    maximized?: boolean;
    onPointerDown?: (e: PointerEvent) => void;
    onMin?: () => void;
    onMax?: () => void;
    onClose?: () => void;
  }

  let { icon, title, active = true, maximized, onPointerDown, onMin, onMax, onClose }: Props = $props();

  const headerClass = [
    "group no-select chrome flex h-7 cursor-move items-center gap-1.5 px-1 py-0.75 pl-1.5",
    "bg-[linear-gradient(90deg,var(--title-inactive-from),var(--title-inactive-to))]",
    "text-[var(--title-inactive-text)]",
    "data-[active=true]:bg-[linear-gradient(90deg,var(--title-active-from),var(--title-active-to))]",
    "data-[active=true]:text-[var(--title-active-text)]",
  ].join(" ");

  const iconClass = [
    "h-4 w-4 object-contain",
    "[filter:grayscale(1)_opacity(0.6)]",
    "group-data-[active=true]:[filter:none]",
  ].join(" ");

  const iconWrapClass = [
    "bevel-in flex h-5 w-5 shrink-0 items-center justify-center",
    "bg-[var(--title-icon-bg)]",
    "[box-shadow:1px_1px_0_var(--title-icon-shadow)]",
    "[outline:1px_solid_var(--title-icon-border)]",
    "[outline-offset:-2px]",
  ].join(" ");

  const titleClass = [
    "text-15 flex-1 overflow-hidden text-ellipsis whitespace-nowrap",
    "[text-shadow:none]",
    "group-data-[active=true]:[text-shadow:1px_1px_0_rgba(0,0,0,0.35)]",
  ].join(" ");

  const sysBtnClass = "w-5.5 h-5 text-sm font-bold text-text";
</script>

<div
  class={headerClass}
  role="toolbar"
  aria-label="Window header"
  data-active={active}
  tabindex="0"
  onpointerdown={onPointerDown}
  ondblclick={() => onMax?.()}
>
  {#if icon}
    <span class={iconWrapClass} aria-hidden="true">
      <img src={icon} alt="" class={iconClass} width="16" height="16" loading="lazy" decoding="async" />
    </span>
  {/if}
  <span class={titleClass}>{title}</span>
  <div class="flex gap-0.75" role="group" aria-label="Window controls" onpointerdown={(e) => e.stopPropagation()}>
    {#if onMin}
      <RetroButton variant="icon" class={sysBtnClass} aria-label="Minimize" title="Minimize" onclick={onMin}>
        <Icon icon="ic:baseline-minimize" width="16" height="16" />
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
        <Icon icon={maximized ? "pixelarticons:card-stack" : "pixelarticons:card-sharp"} width="16" height="16" />
      </RetroButton>
    {/if}
    {#if onClose}
      <RetroButton variant="icon" class={sysBtnClass} aria-label="Close" title="Close" onclick={onClose}>
        <Icon icon="pixelarticons:close" width="16" height="16" />
      </RetroButton>
    {/if}
  </div>
</div>
