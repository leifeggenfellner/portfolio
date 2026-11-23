<script lang="ts">
  import type { IconName } from "@lib/icons";
  import Icon from "@primitives/Icon.svelte";
  import { durationMs, prefersReducedMotion } from "@lib/motion";
  import { onMount } from "svelte";
  import { expoOut } from "svelte/easing";
  import type { TransitionConfig } from "svelte/transition";

  export interface StartMenuItem {
    id: string;
    label: string;
    /** An app's pixel icon (image URL)… */
    image?: string;
    /** …or a UI icon, for system entries. */
    icon?: IconName;
    separatorBefore?: boolean;
  }

  interface Props {
    items: StartMenuItem[];
    /** The Start button; clicks on it toggle the menu instead of counting as outside clicks. */
    anchor?: HTMLElement | null;
    onSelect: (id: string, origin: DOMRect) => void;
    /** `restoreFocus` is true when the menu closed from the keyboard. */
    onClose: (restoreFocus: boolean) => void;
  }

  let { items, anchor, onSelect, onClose }: Props = $props();

  let menuEl = $state<HTMLElement>();
  let focusIndex = $state(0);

  const ITEM_CLASS = [
    "font-body text-14 text-text flex min-h-9 w-full items-center gap-2.5 px-3 text-left outline-none",
    "focus:bg-[linear-gradient(90deg,var(--title-active-from),var(--title-active-to))] focus:text-(--title-active-text)",
  ].join(" ");

  function itemButtons(): HTMLElement[] {
    return menuEl ? [...menuEl.querySelectorAll<HTMLElement>('[role="menuitem"]')] : [];
  }

  function focusItem(index: number) {
    const buttons = itemButtons();
    if (!buttons.length) return;
    focusIndex = (index + buttons.length) % buttons.length;
    buttons[focusIndex]?.focus();
  }

  function choose(item: StartMenuItem, button: HTMLElement) {
    onSelect(item.id, button.getBoundingClientRect());
    onClose(false);
  }

  function handleKeydown(e: KeyboardEvent) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        focusItem(focusIndex + 1);
        break;
      case "ArrowUp":
        e.preventDefault();
        focusItem(focusIndex - 1);
        break;
      case "Home":
        e.preventDefault();
        focusItem(0);
        break;
      case "End":
        e.preventDefault();
        focusItem(items.length - 1);
        break;
      case "Escape":
        e.preventDefault();
        onClose(true);
        break;
      case "Tab":
        onClose(false);
        break;
    }
  }

  function handleOutside(e: PointerEvent) {
    const target = e.target as Node;
    if (menuEl?.contains(target) || anchor?.contains(target)) return;
    onClose(false);
  }

  // Rises out of the taskbar; leaves faster than it arrives.
  function menuMotion(_node: Element, { leaving }: { leaving: boolean }): TransitionConfig {
    if (prefersReducedMotion()) return { duration: 0 };
    return {
      duration: leaving ? durationMs("--dur-1", 80) : durationMs("--dur-2", 160),
      easing: expoOut,
      css: (t, u) => `transform: translateY(${u * 8}px); opacity: ${t};`,
    };
  }

  onMount(() => {
    focusItem(0);
    document.addEventListener("pointerdown", handleOutside);
    return () => document.removeEventListener("pointerdown", handleOutside);
  });
</script>

<div
  bind:this={menuEl}
  role="menu"
  aria-label="Start"
  tabindex="-1"
  class="bevel-out bg-surface shadow-window fixed bottom-(--taskbar-height) left-0 z-(--z-startmenu) flex min-w-60 p-0.75"
  onkeydown={handleKeydown}
  in:menuMotion={{ leaving: false }}
  out:menuMotion={{ leaving: true }}
>
  <div
    aria-hidden="true"
    class="font-chrome text-18 flex w-8 shrink-0 rotate-180 items-center justify-start bg-[linear-gradient(to_bottom,var(--title-active-from),var(--title-active-to))] px-1 py-3 leading-none tracking-[0.12em] text-(--title-active-text) [writing-mode:vertical-rl]"
  >
    RETRO//OS
  </div>
  <div class="flex flex-1 flex-col py-0.5">
    {#each items as item, i (item.id)}
      {#if item.separatorBefore}
        <div role="separator" class="border-bevel-shadow mx-1 my-1 border-t border-b border-b-(--bevel-hilite)"></div>
      {/if}
      <button
        type="button"
        role="menuitem"
        tabindex={focusIndex === i ? 0 : -1}
        class={ITEM_CLASS}
        onclick={(e) => choose(item, e.currentTarget)}
        onpointerenter={() => focusItem(i)}
      >
        <span class="flex h-4 w-4 shrink-0 items-center justify-center" aria-hidden="true">
          {#if item.icon}
            <Icon icon={item.icon} />
          {:else if item.image}
            <img src={item.image} alt="" width="16" height="16" class="h-4 w-4 object-contain" />
          {/if}
        </span>
        <span>{item.label}</span>
      </button>
    {/each}
  </div>
</div>
