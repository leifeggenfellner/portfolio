import icon from "@/assets/icons/apps/pixel/minesweeper.svg?url";
import type { AppManifest } from "@lib/app-shell";

export default {
  route: "/minesweeper/",
  id: "minigame",
  order: 5,
  title: "Minesweeper",
  description: "Minesweeper on a retro desktop, playable with mouse, touch or keyboard.",
  icon,
  defaults: { x: 500, y: 60, w: 300, h: 470 },
  load: () => import("./App.svelte"),
} satisfies AppManifest;
