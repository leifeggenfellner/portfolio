/**
 * App registry. Each entry is a tiny manifest:
 *  - id:       stable string used as the window id seed
 *  - title:    title-bar text
 *  - icon:     emoji glyph (placeholder; swap for sprites later)
 *  - render:   lazy app body (a React component)
 *  - defaults: initial geometry
 *
 * Apps are the composed portfolio layer. They MUST NOT import
 * each other; cross-app composition goes through the shell.
 */
import { lazy, type LazyExoticComponent, type ComponentType } from "react";

export interface AppManifest {
  id: string;
  title: string;
  icon: string;
  defaults: { x: number; y: number; w: number; h: number };
  render: LazyExoticComponent<ComponentType<unknown>>;
}

export const APPS: AppManifest[] = [
  {
    id: "about",
    title: "Me.txt — Notepad",
    icon: "📝",
    defaults: { x: 80, y: 70, w: 460, h: 360 },
    render: lazy(() => import("./About")),
  },
  {
    id: "projects",
    title: "Projects",
    icon: "📁",
    defaults: { x: 180, y: 110, w: 620, h: 420 },
    render: lazy(() => import("./ProjectsExplorer")),
  },
  {
    id: "terminal",
    title: "Terminal",
    icon: "▮",
    defaults: { x: 260, y: 160, w: 540, h: 340 },
    render: lazy(() => import("./Terminal")),
  },
  {
    id: "skills",
    title: "Skills Matrix",
    icon: "🎛",
    defaults: { x: 340, y: 200, w: 520, h: 360 },
    render: lazy(() => import("./SkillsMatrix")),
  },
  {
    id: "contact",
    title: "contact://send",
    icon: "✉",
    defaults: { x: 420, y: 240, w: 480, h: 360 },
    render: lazy(() => import("./ContactTerminal")),
  },
  {
    id: "minigame",
    title: "minesweeper.exe",
    icon: "💣",
    defaults: { x: 500, y: 80, w: 320, h: 360 },
    render: lazy(() => import("./MiniGame")),
  },
];
