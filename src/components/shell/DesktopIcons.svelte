<script lang="ts">
  import { cx } from "@lib/cx";
  import { getOs } from "@lib/os/context";

  // A wrapping column on a desktop, a four-up grid on a phone; CSS, so the server HTML is already right.
  const ICON_GRID = [
    "absolute top-4 z-(--z-desktop) [--focus-ring-color:var(--desktop-text)]",
    "left-4 flex max-h-[calc(100dvh-2rem-var(--taskbar-height))] flex-col flex-wrap content-start gap-3",
    "phone:left-3 phone:right-3 phone:grid phone:max-h-none phone:grid-cols-4",
  ].join(" ");
  const ICON_BUTTON_BASE = "focus-ring icon-label text-12 flex flex-col items-center gap-1 p-1 text-white";
  const ICON_IMG_CLASS = "icon-glow h-(--desktop-icon-size) w-(--desktop-icon-size) object-contain";

  const { launcher, viewport } = getOs();

  let list = $state<HTMLElement>();
  let selected = $state<string | null>(null);

  /** Focus the first icon, e.g. when the help note closes. */
  export function focusFirst() {
    list?.querySelector<HTMLElement>("[data-app-id]")?.focus();
  }

  const href = (route: string) => `${import.meta.env.BASE_URL}${route.slice(1)}`;

  function open(appId: string, button: HTMLElement) {
    void launcher.open(appId, { origin: button.getBoundingClientRect() });
  }

  // Icons are links to each app's page, which is all they do without JS
  // (so not prefetched: with JS they open a window in place, never the page).
  // With it, a click selects and a double-click opens, as on a period
  // desktop. Enter fires a click with detail 0, so the keyboard opens in one
  // press; touch has no double-tap convention here, so a tap opens. A
  // modified click (new tab, new window) is left to the browser.
  function handleClick(appId: string, e: MouseEvent & { currentTarget: HTMLElement }) {
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    selected = appId;
    if (viewport.mobile || e.detail === 0) open(appId, e.currentTarget);
  }

  // Space opens too, as it did when icons were buttons.
  function handleKeydown(e: KeyboardEvent & { currentTarget: HTMLElement }) {
    if (e.key === " ") {
      e.preventDefault();
      open(e.currentTarget.dataset.appId ?? "", e.currentTarget);
      return;
    }
    moveSelection(e);
  }

  // Arrow keys walk the icon column; the selection follows focus.
  function moveSelection(e: KeyboardEvent) {
    const buttons = [...(list?.querySelectorAll<HTMLElement>("[data-app-id]") ?? [])];
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
    if (!(e.target as Element).closest("[data-app-id]")) selected = null;
  }
</script>

<svelte:document onpointerdown={handleDocumentPointerDown} />

<ul bind:this={list} aria-label="Desktop" class={ICON_GRID}>
  {#each launcher.apps as app (app.id)}
    <li>
      <a
        href={href(app.route)}
        data-app-id={app.id}
        data-astro-prefetch="false"
        data-selected={selected === app.id}
        ondblclick={(e) => open(app.id, e.currentTarget)}
        onclick={(e) => handleClick(app.id, e)}
        onfocus={() => (selected = app.id)}
        onkeydown={handleKeydown}
        class={cx(ICON_BUTTON_BASE, "phone:w-full w-19")}
      >
        <img src={app.icon} alt="" aria-hidden="true" class={ICON_IMG_CLASS} width="32" height="32" decoding="async" />
        <span>{app.label ?? app.title.split(" ")[0]}</span>
      </a>
    </li>
  {/each}
</ul>
