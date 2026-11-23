// Types for the modules src/content/vite-plugin.ts serves.
declare module "virtual:content/profile" {
  import type { Profile } from "@content/schema";
  export const PROFILE: Profile;
}
declare module "virtual:content/skills" {
  import type { SkillGroup } from "@content/schema";
  export const SKILL_GROUPS: readonly SkillGroup[];
}
declare module "virtual:content/projects" {
  import type { Project } from "@content/schema";
  /** Featured first, then newest. */
  export const PROJECTS: readonly Project[];
}
