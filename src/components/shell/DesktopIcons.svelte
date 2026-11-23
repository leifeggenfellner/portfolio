<script lang="ts">
  import { cx } from "@lib/cx";
  import { getOs } from "@lib/os/context";

  const ICON_GRID_BASE = "absolute top-4 z-(--z-desktop) [--focus-ring-color:var(--desktop-text)]";
  const ICON_GRID_DESKTOP =
    "left-4 flex max-h-[calc(100dvh-2rem-var(--taskbar-height))] flex-col flex-wrap content-start gap-3";
  const ICON_GRID_MOBILE = "left-3 right-3 grid grid-cols-4 gap-3";
  const ICON_BUTTON_BASE = "focus-ring icon-label text-12 flex flex-col items-center gap-1 p-1 text-white";
  const ICON_IMG_CLASS = "icon-glow h-(--desktop-icon-size) w-(--desktop-icon-size) object-contain";

  const { launcher, viewport } = getOs();

  let list = $state<HTMLElement>();
  let selected = $state<string | null>(null);

  /** Focus the first icon, e.g. when the help note closes. */
  export function focusFirst() {
    list?.querySelector<HTMLElement>("button")?.focus();
  }

  function open(appId: string, button: HTMLElement) {
    void launcher.open(appId, button.getBoundingClientRect());
  }

  // A mouse click selects and a double-click opens, as on a period desktop.
  // Enter/Space fire a click with detail 0, so the keyboard opens in one press;
  // touch has no double-tap convention here, so a tap opens.
  function handleClick(appId: string, e: MouseEvent & { currentTarget: HTMLElement }) {
    selected = appId;
    if (viewport.mobile || e.detail === 0) open(appId, e.currentTarget);
  }

  // Arrow keys walk the icon column; the selection follows focus.
  function handleKeydown(e: KeyboardEvent) {
    const buttons = [...(list?.querySelectorAll<HTMLElement>("button[data-app-id]") ?? [])];
    const index = buttons.indexOf(document.activeElement as HTMLElement);
    if (index < 0) return;
    const next = {
      ArrowDown: index + 1,
      ArrowRight: index + 1,
      ArrowUp: index - 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: buttons.length - 1,
    }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    const target = buttons[Math.min(Math.max(next, 0), buttons.length - 1)];
    target?.focus();
    selected = target?.dataset.appId ?? selected;
  }

  // A press anywhere but an icon clears the selection.
  function handleDocumentPointerDown(e: PointerEvent) {
    if (!(e.target as Element).closest("button[data-app-id]")) selected = null;
  }
</script>

<svelte:document onpointerdown={handleDocumentPointerDown} />

<ul
  bind:this={list}
  aria-label="Desktop"
  class={cx(ICON_GRID_BASE, viewport.mobile ? ICON_GRID_MOBILE : ICON_GRID_DESKTOP)}
>
  {#each launcher.apps as app (app.id)}
    <li>
      <button
        type="button"
        data-app-id={app.id}
        data-selected={selected === app.id}
        ondblclick={(e) => open(app.id, e.currentTarget)}
        onclick={(e) => handleClick(app.id, e)}
        onfocus={() => (selected = app.id)}
        onkeydown={handleKeydown}
        class={cx(ICON_BUTTON_BASE, viewport.mobile ? "w-full" : "w-19")}
      >
        <img src={app.icon} alt="" aria-hidden="true" class={ICON_IMG_CLASS} width="32" height="32" decoding="async" />
        <span>{app.title.split(" ")[0]}</span>
      </button>
    </li>
  {/each}
</ul>
