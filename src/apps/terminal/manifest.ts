import icon from "@/assets/icons/apps/pixel/terminal.svg?url";
import type { AppManifest } from "@lib/app-shell";

/** Terminal commands worth a palette entry; each runs in the Terminal window. */
const COMMANDS = [
  "help",
  "neofetch",
  "whoami",
  "cat about.txt",
  "cat cv.txt",
  "ls projects",
  "fortune",
  "matrix",
  "pipes",
];

export default {
  route: "/terminal/",
  id: "terminal",
  order: 2,
  title: "Terminal",
  icon,
  defaults: { x: 220, y: 90, w: 720, h: 460 },
  load: () => import("./App.svelte"),
  parseArgs: ({ command }) => (command ? { command } : undefined),
  commands: COMMANDS.map((command) => ({ label: command, args: { command } })),
} satisfies AppManifest;
