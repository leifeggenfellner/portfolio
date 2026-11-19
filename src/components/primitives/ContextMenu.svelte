<script lang="ts">
  import { onMount } from "svelte";
  import Icon from "@iconify/svelte";

  export interface MenuItem {
    id: string;
    label: string;
    icon?: string;
    disabled?: boolean;
    separator?: false;
  }

  export interface MenuSeparator {
    separator: true;
  }

  export type MenuEntry = MenuItem | MenuSeparator;

  interface Props {
    items: MenuEntry[];
    x: number;
    y: number;
    onSelect?: (id: string) => void;
    onClose?: () => void;
  }

  let { items, x, y, onSelect, onClose }: Props = $props();
  let menuEl: HTMLElement | undefined = $state();
  let focusIndex = $state(-1);

  const actionItems = $derived(
    items
      .map((entry, i) => ({ entry, i }))
      .filter((e): e is { entry: MenuItem; i: number } => !("separator" in e.entry && e.entry.separator)),
  );

  function clampPosition(el: HTMLElement) {
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (x + rect.width > vw) x = vw - rect.width - 4;
    if (y + rect.height > vh) y = vh - rect.height - 4;
    if (x < 0) x = 4;
    if (y < 0) y = 4;
  }

  function handleKeydown(e: KeyboardEvent) {
    switch (e.key) {
      case "Escape":
        e.preventDefault();
        onClose?.();
        break;
      case "ArrowDown":
        e.preventDefault();
        focusIndex = (focusIndex + 1) % actionItems.length;
        break;
      case "ArrowUp":
        e.preventDefault();
        focusIndex = (focusIndex - 1 + actionItems.length) % actionItems.length;
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (focusIndex >= 0) {
          const item = actionItems[focusIndex]?.entry;
          if (item && !item.disabled) {
            onSelect?.(item.id);
            onClose?.();
          }
        }
        break;
      case "Tab":
        e.preventDefault();
        onClose?.();
        break;
    }
  }

  function handleItemClick(item: MenuItem) {
    if (item.disabled) return;
    onSelect?.(item.id);
    onClose?.();
  }

  function handleOutsideClick(e: MouseEvent) {
    if (menuEl && !menuEl.contains(e.target as Node)) {
      onClose?.();
    }
  }

  onMount(() => {
    if (menuEl) {
      clampPosition(menuEl);
      menuEl.focus();
    }
    // Delay adding click-outside to prevent the triggering right-click from closing it
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleOutsideClick);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  });

  $effect(() => {
    if (focusIndex >= 0 && menuEl) {
      const items = menuEl.querySelectorAll<HTMLElement>('[role="menuitem"]');
      items[focusIndex]?.focus();
    }
  });
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
  bind:this={menuEl}
  class="context-menu"
  role="menu"
  tabindex="-1"
  style="left: {x}px; top: {y}px;"
  onkeydown={handleKeydown}
>
  {#each items as entry, i}
    {#if "separator" in entry && entry.separator}
      <div class="context-menu__separator" role="separator"></div>
    {:else}
      {@const item = entry as MenuItem}
      {@const actionIdx = actionItems.findIndex((a) => a.i === i)}
      <button
        type="button"
        role="menuitem"
        class="context-menu__item"
        class:context-menu__item--disabled={item.disabled}
        class:context-menu__item--focused={focusIndex === actionIdx}
        tabindex={focusIndex === actionIdx ? 0 : -1}
        aria-disabled={item.disabled || undefined}
        onclick={() => handleItemClick(item)}
        onpointerenter={() => (focusIndex = actionIdx)}
      >
        {#if item.icon}
          <span class="context-menu__icon" aria-hidden="true">
            <Icon icon={item.icon} width="14" height="14" />
          </span>
        {/if}
        <span class="context-menu__label">{item.label}</span>
      </button>
    {/if}
  {/each}
</div>
