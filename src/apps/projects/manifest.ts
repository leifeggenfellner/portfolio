import icon from "@/assets/icons/apps/pixel/projects.svg?url";
import type { AppManifest } from "@lib/app-shell";

export default {
  kind: "svelte",
  id: "projects",
  order: 1,
  title: "Projects",
  icon,
  defaults: { x: 180, y: 110, w: 620, h: 420 },
  load: () => import("./App.svelte"),
  parseArgs: ({ project }) => (project ? { project } : undefined),
} satisfies AppManifest;
