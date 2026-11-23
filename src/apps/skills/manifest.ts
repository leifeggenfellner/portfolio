import icon from "@/assets/icons/apps/pixel/skills.svg?url";
import type { AppManifest } from "@lib/app-shell";

export default {
  route: "/skills/",
  id: "skills",
  order: 3,
  title: "Skills Matrix",
  icon,
  defaults: { x: 340, y: 200, w: 520, h: 360 },
  load: () => import("./App.svelte"),
} satisfies AppManifest;
