import icon from "@/assets/icons/apps/pixel/contact.svg?url";
import type { AppManifest } from "@lib/app-shell";

export default {
  route: "/contact/",
  id: "contact",
  order: 4,
  title: "Contact",
  description: "Write to Leif Eggenfellner from a retro desktop mail window.",
  icon,
  defaults: { x: 420, y: 120, w: 500, h: 460 },
  load: () => import("./App.svelte"),
} satisfies AppManifest;
