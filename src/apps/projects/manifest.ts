import icon from "@/assets/icons/apps/pixel/projects.svg?url";
import type { AppManifest } from "@lib/app-shell";

export default {
  route: "/projects/",
  id: "projects",
  order: 1,
  title: "Projects",
  icon,
  defaults: { x: 180, y: 110, w: 620, h: 420 },
  load: () => import("./App.svelte"),
  parseArgs: ({ project }) => (project ? { project } : undefined),
  routes: async () => {
    const { PROJECTS } = await import("@content/projects");
    return PROJECTS.map((p) => ({
      path: `/projects/${p.slug}/` as const,
      args: { project: p.slug },
      title: p.name,
      description: `${p.tagline} ${p.summary}`,
    }));
  },
} satisfies AppManifest;
