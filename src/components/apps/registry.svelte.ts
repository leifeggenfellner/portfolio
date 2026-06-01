import minigameIcon from "@/assets/icons/apps/16/gnome-mines.svg?url";
import contactIcon from "@/assets/icons/apps/16/mail.svg?url";
import aboutIcon from "@/assets/icons/apps/16/notepad.svg?url";
import projectsIcon from "@/assets/icons/apps/16/package.svg?url";
import skillsIcon from "@/assets/icons/apps/16/skills-chart.svg?url";
import terminalIcon from "@/assets/icons/apps/16/terminal.svg?url";
import type { Component } from "svelte";

interface AppCommon {
  id: string;
  title: string;
  icon: string;
  defaults: { x: number; y: number; w: number; h: number };
}

/** Static app — pre-rendered Astro HTML, injected via {@html}. Zero JS. */
export interface StaticApp extends AppCommon {
  kind: "static";
}

/** Interactive app — Svelte component, dynamic-imported on first open. */
export interface SvelteApp extends AppCommon {
  kind: "svelte";
  load: () => Promise<{ default: Component }>;
}

export type AppManifest = StaticApp | SvelteApp;

export const APPS: AppManifest[] = [
  {
    kind: "static",
    id: "about",
    title: "Me.txt — Notepad",
    icon: aboutIcon,
    defaults: { x: 80, y: 70, w: 460, h: 360 },
  },
  {
    kind: "static",
    id: "projects",
    title: "Projects",
    icon: projectsIcon,
    defaults: { x: 180, y: 110, w: 620, h: 420 },
  },
  {
    kind: "svelte",
    id: "terminal",
    title: "Terminal",
    icon: terminalIcon,
    defaults: { x: 260, y: 160, w: 540, h: 340 },
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
    defaults: { x: 420, y: 240, w: 480, h: 360 },
    load: () => import("@apps/ContactTerminal.svelte"),
  },
  {
    kind: "svelte",
    id: "minigame",
    title: "Minesweeper",
    icon: minigameIcon,
    defaults: { x: 500, y: 80, w: 320, h: 360 },
    load: () => import("@apps/MiniGame.svelte"),
  },
];
