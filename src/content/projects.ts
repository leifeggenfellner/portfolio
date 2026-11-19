/**
 * Projects for the client-side apps. The same JSON files back the `projects`
 * collection, which validates them against `projectSchema` at build time.
 */
import type { Project } from "./schema";

const modules = import.meta.glob<{ default: Project }>("./projects/*.json", { eager: true });

/** Featured first, then newest first. */
export const PROJECTS: readonly Project[] = Object.values(modules)
  .map((mod) => mod.default)
  .sort((a, b) => Number(b.featured) - Number(a.featured) || b.year - a.year || a.name.localeCompare(b.name));
