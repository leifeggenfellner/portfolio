import aboutIcon from "@/assets/icons/apps/pixel/about.svg?url";
import contactIcon from "@/assets/icons/apps/pixel/contact.svg?url";
import minigameIcon from "@/assets/icons/apps/pixel/minesweeper.svg?url";
import projectsIcon from "@/assets/icons/apps/pixel/projects.svg?url";
import settingsIcon from "@/assets/icons/apps/pixel/settings.svg?url";
import skillsIcon from "@/assets/icons/apps/pixel/skills.svg?url";
import terminalIcon from "@/assets/icons/apps/pixel/terminal.svg?url";
import type { AppManifest } from "@lib/app-shell";

export const APPS: AppManifest[] = [
  {
    kind: "static",
    id: "about",
    title: "Me.txt — Notepad",
    icon: aboutIcon,
    defaults: { x: 80, y: 70, w: 460, h: 360 },
  },
  {
    kind: "svelte",
    id: "projects",
    title: "Projects",
    icon: projectsIcon,
    defaults: { x: 180, y: 110, w: 620, h: 420 },
    load: () => import("@apps/ProjectsExplorer.svelte"),
  },
  {
    kind: "svelte",
    id: "terminal",
    title: "Terminal",
    icon: terminalIcon,
    defaults: { x: 220, y: 90, w: 720, h: 460 },
    load: () => import("@apps/Terminal.svelte"),
  },
  {
    kind: "static",
    id: "skills",
    title: "Skills Matrix",
    icon: skillsIcon,
    defaults: { x: 340, y: 200, w: 520, h: 360 },
  },
  {
    kind: "svelte",
    id: "contact",
    title: "Contact",
    icon: contactIcon,
    defaults: { x: 420, y: 120, w: 500, h: 460 },
    load: () => import("@apps/ContactTerminal.svelte"),
  },
  {
    kind: "svelte",
    id: "minigame",
    title: "Minesweeper",
    icon: minigameIcon,
    defaults: { x: 500, y: 60, w: 300, h: 470 },
    load: () => import("@apps/MiniGame.svelte"),
  },
  {
    kind: "svelte",
    id: "settings",
    title: "Settings",
    icon: settingsIcon,
    defaults: { x: 560, y: 120, w: 380, h: 440 },
    load: () => import("@apps/Settings.svelte"),
  },
];
