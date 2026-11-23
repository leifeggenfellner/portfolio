import icon from "@/assets/icons/apps/pixel/settings.svg?url";
import type { AppManifest } from "@lib/app-shell";

export default {
  route: "/settings/",
  id: "settings",
  order: 6,
  title: "Settings",
  icon,
  defaults: { x: 560, y: 120, w: 380, h: 440 },
  load: () => import("./App.svelte"),
} satisfies AppManifest;
