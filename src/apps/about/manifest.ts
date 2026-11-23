import icon from "@/assets/icons/apps/pixel/about.svg?url";
import type { AppManifest } from "@lib/app-shell";

export default {
  route: "/about/",
  id: "about",
  order: 0,
  title: "Me.txt — Notepad",
  description:
    "Who Leif Eggenfellner is: a full-stack developer in Tromsø. Bio, work and education, as a text file on a retro desktop.",
  icon,
  defaults: { x: 80, y: 70, w: 460, h: 360 },
  load: () => import("./App.svelte"),
} satisfies AppManifest;
