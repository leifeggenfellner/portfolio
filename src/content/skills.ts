/**
 * Skills Matrix data. Each entry names where it can be seen in practice, so
 * the matrix is evidence rather than self-rating; there are no percentages.
 */

export interface Skill {
  name: string;
  /** Where to see it: a job, a project or this site. */
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
      { name: "TypeScript", evidence: "day job; every module of this site" },
      { name: "Vue.js", evidence: "day job at Helse Nord IKT" },
      { name: "Svelte 5", evidence: "this site's window manager and apps" },
      { name: "React / Next.js", evidence: "internship at Torghatten" },
      { name: "Angular", evidence: "internship at Hemit" },
      { name: "Astro", evidence: "this site" },
      { name: "Tailwind CSS", evidence: "this site; Torghatten" },
      { name: "Three.js", evidence: "internship at KSAT" },
    ],
  },
  {
    name: "Backend and data",
    skills: [
      { name: "Scala", evidence: "day job at Helse Nord IKT" },
      { name: "PostgreSQL", evidence: "day job at Helse Nord IKT" },
      { name: "Kotlin / Java", evidence: "Torghatten; Advent of Code 2022" },
      { name: ".NET", evidence: "internship at Hemit" },
      { name: "Python", evidence: "TSI Apparel; Advent of Code; Project Euler" },
      { name: "Rust", evidence: "Advent of Code" },
    ],
  },
  {
    name: "DevOps and tooling",
    skills: [
      { name: "Nix / NixOS", evidence: "dotfiles; this repo's dev shell" },
      { name: "Docker", evidence: "DevOps team lead at Orbit NTNU" },
      { name: "GitLab CI", evidence: "Orbit NTNU; KSAT" },
      { name: "GitHub Actions", evidence: "this site; TSI Apparel" },
      { name: "Linux", evidence: "daily driver (NixOS)" },
    ],
  },
  {
    name: "Quality",
    skills: [
      { name: "Testing", evidence: "Vitest and Playwright here; pytest in TSI Apparel" },
      { name: "Accessibility", evidence: "keyboard-first desktop, axe in CI" },
    ],
  },
];
