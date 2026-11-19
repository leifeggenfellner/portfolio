/**
 * Skills Matrix data. Each entry names where it can be seen in practice, so
 * the matrix is evidence rather than self-rating; there are no percentages.
 *
 * Only what this repository demonstrates is listed so far.
 */

export interface Skill {
  name: string;
  /** Where to see it: a project slug or a short note. */
  evidence: string;
}

export interface SkillGroup {
  name: string;
  skills: Skill[];
}

export const SKILL_GROUPS: SkillGroup[] = [
  {
    name: "Frontend",
    skills: [
      { name: "TypeScript (strict)", evidence: "every module here" },
      { name: "Svelte 5", evidence: "window manager, apps" },
      { name: "Astro", evidence: "static shell, zero-JS apps" },
      { name: "Tailwind CSS v4", evidence: "token-driven themes" },
      { name: "Canvas 2D", evidence: "the horizon grid" },
    ],
  },
  {
    name: "Quality",
    skills: [
      { name: "Accessibility", evidence: "keyboard-first desktop" },
      { name: "Vitest", evidence: "unit tests for every lib module" },
      { name: "Playwright", evidence: "e2e on Chromium, WebKit, mobile" },
    ],
  },
  {
    name: "Tooling",
    skills: [
      { name: "Nix", evidence: "reproducible dev shell" },
      { name: "GitHub Actions", evidence: "CI and Pages deploy" },
    ],
  },
];
