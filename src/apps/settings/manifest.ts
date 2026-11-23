import icon from "@/assets/icons/apps/pixel/settings.svg?url";
import type { AppManifest } from "@lib/app-shell";

export default {
  route: "/settings/",
  id: "settings",
  order: 6,
  title: "Settings",
  description: "Settings for the RETRO//OS desktop: theme, CRT effect, grid speed, icons, cursors and the screensaver.",
  icon,
  defaults: { x: 560, y: 120, w: 380, h: 440 },
  load: () => import("./App.svelte"),
} satisfies AppManifest;
