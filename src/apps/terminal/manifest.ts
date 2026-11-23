import icon from "@/assets/icons/apps/pixel/terminal.svg?url";
import type { AppManifest } from "@lib/app-shell";

export default {
  kind: "svelte",
  id: "terminal",
  order: 2,
  title: "Terminal",
  icon,
  defaults: { x: 220, y: 90, w: 720, h: 460 },
  load: () => import("./App.svelte"),
} satisfies AppManifest;
