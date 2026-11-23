import icon from "@/assets/icons/apps/pixel/about.svg?url";
import type { AppManifest } from "@lib/app-shell";

export default {
  kind: "static",
  id: "about",
  order: 0,
  title: "Me.txt — Notepad",
  icon,
  defaults: { x: 80, y: 70, w: 460, h: 360 },
} satisfies AppManifest;
