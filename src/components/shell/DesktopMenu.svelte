<script lang="ts">
  import { getOs } from "@lib/os/context";
  import ContextMenu from "@primitives/ContextMenu.svelte";
  import type { MenuEntry } from "@primitives/ContextMenu.svelte";

  const { launcher, settings, windows } = getOs();

  let at = $state<{ x: number; y: number } | null>(null);

  /** Open at the pointer; wire to the desktop's contextmenu event. */
  export function openAt(e: MouseEvent) {
    e.preventDefault();
    at = { x: e.clientX, y: e.clientY };
  }

  const dark = $derived(settings.current.theme === "dark");

  const items = $derived<MenuEntry[]>([
    ...launcher.apps.map((a) => ({ id: `open:${a.id}`, label: a.title, icon: "pixelarticons:folder" })),
    { separator: true as const },
    { id: "theme:toggle", label: dark ? "Light Theme" : "Dark Theme", icon: dark ? "lucide:sun" : "lucide:moon" },
    { id: "cascade", label: "Cascade Windows", icon: "pixelarticons:layout" },
  ]);

  function select(id: string) {
    if (id.startsWith("open:")) void launcher.open(id.slice("open:".length));
    else if (id === "theme:toggle") settings.set("theme", dark ? "light" : "dark");
    else if (id === "cascade") windows.cascade();
  }
</script>

{#if at}
  <ContextMenu {items} x={at.x} y={at.y} onSelect={select} onClose={() => (at = null)} />
{/if}
