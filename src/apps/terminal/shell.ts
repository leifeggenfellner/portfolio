/**
 * The terminal's command interpreter. Pure: it reads a context and returns
 * the lines to print plus any state change, and reaches the rest of the site
 * only through the `actions` the caller provides.
 */
import { SHORTCUTS, shortcutsByPlace } from "@lib/os/shortcuts";
import { CRT_MODES, GRID_SPEEDS, THEMES } from "@lib/settings";
import { formatPath, listDir, nodeAt, resolvePath } from "./fs";
import { pipeCount } from "./pipes";
import { FORTUNES, monitorSays, TRAIN } from "./toys";
import type { FsDir } from "./fs";
import type { CrtMode, GridSpeed, Theme } from "@lib/settings";

export type Tone = "dim" | "err" | "accent" | "prompt";

export interface Line {
  text: string;
  tone?: Tone;
}

export interface ShellActions {
  open(appId: string): void;
  setTheme(theme: Theme): void;
  setCrt(mode: CrtMode): void;
  setGridSpeed(speed: GridSpeed): void;
  exit(): void;
  /** Crash the terminal on purpose, so its blue screen can be seen. */
  panic(): void;
}

export interface ShellContext {
  root: FsDir;
  home: readonly string[];
  cwd: readonly string[];
  user: string;
  host: string;
  /** Previous commands, oldest first. */
  history: readonly string[];
  apps: readonly { id: string; title: string }[];
  /** Lines for `whoami`. */
  whoami: readonly string[];
  /** Label/value rows for `neofetch`. */
  neofetch: readonly (readonly [string, string])[];
  actions: ShellActions;
  now(): Date;
  /** A number in [0, 1), as Math.random; injected so tests can pin it. */
  random(): number;
}

/** A visual effect the terminal plays over its pane until a key stops it. */
export type TerminalEffect = { name: "matrix" } | { name: "pipes"; count: number };

export interface ShellResult {
  lines: Line[];
  cwd?: string[];
  clear?: boolean;
  effect?: TerminalEffect;
}

interface Command {
  usage: string;
  summary: string;
  /** The longer description `man` prints. */
  manual: readonly string[];
  run(args: string[], ctx: ShellContext): ShellResult;
}

function out(...texts: string[]): ShellResult {
  return { lines: texts.map((text) => ({ text })) };
}

function err(text: string): ShellResult {
  return { lines: [{ text, tone: "err" }] };
}

function settingCommand<T extends string>(
  name: string,
  allowed: readonly T[],
  apply: (actions: ShellActions, value: T) => void,
): (args: string[], ctx: ShellContext) => ShellResult {
  return (args, ctx) => {
    const value = allowed.find((option) => option === args[0]?.toLowerCase());
    if (!value) return err(`usage: ${name} <${allowed.join("|")}>`);
    apply(ctx.actions, value);
    return out(`${name}: ${value}`);
  };
}

const COMMANDS: Record<string, Command> = {
  help: {
    usage: "help",
    summary: "list commands",
    manual: [
      "List every command with a one-line summary. Hidden commands are",
      "not listed; finding them is the point.",
    ],
    run: () => ({
      lines: [
        ...Object.values(COMMANDS).map(({ usage, summary }) => ({ text: `  ${usage.padEnd(22)}${summary}` })),
        { text: "Tab completes, ↑/↓ walk history, Ctrl+L clears.", tone: "dim" },
      ],
    }),
  },
  ls: {
    usage: "ls [path]",
    summary: "list a directory",
    manual: [
      "List the entries of a directory, or of the current one. Directories",
      "end in a slash. Paths may be relative, absolute, or start with ~.",
    ],
    run: (args, ctx) => {
      const path = resolvePath(ctx.cwd, ctx.home, args[0] ?? ".");
      const node = nodeAt(ctx.root, path);
      if (!node) return err(`ls: ${args[0]}: no such file or directory`);
      if (node.kind === "file") return out(args[0] ?? "");
      const names = listDir(node);
      return names.length ? out(names.join("  ")) : { lines: [] };
    },
  },
  cd: {
    usage: "cd [path]",
    summary: "change directory",
    manual: ["Change the current directory. With no argument, go home (~).", "'..' goes up one level."],
    run: (args, ctx) => {
      const path = resolvePath(ctx.cwd, ctx.home, args[0] ?? "~");
      const node = nodeAt(ctx.root, path);
      if (!node) return err(`cd: ${args[0]}: no such file or directory`);
      if (node.kind !== "dir") return err(`cd: ${args[0]}: not a directory`);
      return { lines: [], cwd: path };
    },
  },
  pwd: {
    usage: "pwd",
    summary: "print the current directory",
    manual: ["Print the full path of the current directory."],
    run: (_args, ctx) => out(`/${ctx.cwd.join("/")}`),
  },
  cat: {
    usage: "cat <file>",
    summary: "print a file",
    manual: ["Print one or more files. Project files (.prj) end with a link to", "their case-study page."],
    run: (args, ctx) => {
      if (!args.length) return err("usage: cat <file>");
      const lines: Line[] = [];
      for (const arg of args) {
        const node = nodeAt(ctx.root, resolvePath(ctx.cwd, ctx.home, arg));
        if (!node) lines.push({ text: `cat: ${arg}: no such file or directory`, tone: "err" });
        else if (node.kind === "dir") lines.push({ text: `cat: ${arg}: is a directory`, tone: "err" });
        else lines.push(...node.lines.map((text) => ({ text })));
      }
      return { lines };
    },
  },
  open: {
    usage: "open <app|file>",
    summary: "open an app window",
    manual: [
      "Open a desktop app by id or title, or a file that belongs to an",
      "app, such as games/minesweeper.exe. Tab completes app ids.",
    ],
    run: (args, ctx) => {
      const target = args[0];
      if (!target) return err(`usage: open <${ctx.apps.map((app) => app.id).join("|")}>`);
      const wanted = target.toLowerCase();
      const app = ctx.apps.find((a) => a.id === wanted || a.title.toLowerCase() === wanted);
      if (app) {
        ctx.actions.open(app.id);
        return { lines: [{ text: `opening ${app.title}…`, tone: "dim" }] };
      }
      const node = nodeAt(ctx.root, resolvePath(ctx.cwd, ctx.home, target));
      if (node?.kind === "file" && node.opens) {
        ctx.actions.open(node.opens);
        return { lines: [{ text: `opening ${target}…`, tone: "dim" }] };
      }
      return err(`open: ${target}: nothing to open. try 'open ${ctx.apps[0]?.id ?? ""}'`);
    },
  },
  whoami: {
    usage: "whoami",
    summary: "who built this",
    manual: ["Who built this site, in one line."],
    run: (_args, ctx) => out(...ctx.whoami),
  },
  neofetch: {
    usage: "neofetch",
    summary: "system summary",
    manual: ["A summary of this system: theme, screen size, uptime and stack."],
    run: (_args, ctx) => {
      const title = `${ctx.user}@${ctx.host}`;
      return {
        lines: [
          { text: title, tone: "accent" },
          { text: "-".repeat(title.length), tone: "dim" },
          ...ctx.neofetch.map(([label, value]) => ({ text: `${`${label}:`.padEnd(9)}${value}` })),
        ],
      };
    },
  },
  theme: {
    usage: "theme <light|dark>",
    summary: "switch the theme",
    manual: ["Switch between the light and dark theme. The choice is saved, as", "it is in Settings."],
    run: settingCommand("theme", THEMES, (actions, value) => actions.setTheme(value)),
  },
  crt: {
    usage: "crt <off|subtle|full>",
    summary: "scanline strength",
    manual: ["Set the strength of the CRT scanlines: off, subtle or full."],
    run: settingCommand("crt", CRT_MODES, (actions, value) => actions.setCrt(value)),
  },
  grid: {
    usage: "grid <paused|slow|…>",
    summary: "horizon grid speed",
    manual: ["Set how fast the horizon grid scrolls, or pause it."],
    run: settingCommand("grid", GRID_SPEEDS, (actions, value) => actions.setGridSpeed(value)),
  },
  history: {
    usage: "history",
    summary: "previous commands",
    manual: [
      "List the commands typed in this session, oldest first. Up and",
      "down arrows walk the same list at the prompt.",
    ],
    run: (_args, ctx) => out(...ctx.history.map((cmd, i) => `${String(i + 1).padStart(4)}  ${cmd}`)),
  },
  echo: {
    usage: "echo <text>",
    summary: "print text",
    manual: ["Print its arguments, separated by single spaces."],
    run: (args) => out(args.join(" ")),
  },
  date: {
    usage: "date",
    summary: "current date and time",
    manual: ["Print the current date and time."],
    run: (_args, ctx) => out(ctx.now().toString()),
  },
  clear: {
    usage: "clear",
    summary: "clear the screen",
    manual: ["Clear the screen. Ctrl+L does the same."],
    run: () => ({ lines: [], clear: true }),
  },
  fortune: {
    usage: "fortune",
    summary: "a random line of wisdom",
    manual: ["Print a random line of questionable wisdom."],
    run: (_args, ctx) => out(FORTUNES[Math.floor(ctx.random() * FORTUNES.length)] ?? ""),
  },
  cowsay: {
    usage: "cowsay <text>",
    summary: "the monitor says it",
    manual: ["Have the monitor say something. Long text wraps in its bubble."],
    run: (args) => out(...monitorSays(args.join(" ") || "moo? wrong animal.")),
  },
  matrix: {
    usage: "matrix",
    summary: "digital rain; any key stops it",
    manual: [
      "Digital rain in the terminal, until any key is pressed. Skipped",
      "when the system asks for reduced motion.",
    ],
    run: () => ({ lines: [{ text: "wake up. (any key stops the rain)", tone: "dim" }], effect: { name: "matrix" } }),
  },
  pipes: {
    usage: "pipes [1-8]",
    summary: "pipes grow; any key stops them",
    manual: [
      "Pipes grow across the terminal, turning at random, each in its own",
      "colour, until any key is pressed. The number sets how many grow at",
      "once (1 to 8, default 4). Skipped when the system asks for reduced",
      "motion.",
    ],
    run: (args) => {
      const count = pipeCount(args[0]);
      if (count === null) return err("usage: pipes [1-8]");
      return { lines: [{ text: "plumbing... (any key stops it)", tone: "dim" }], effect: { name: "pipes", count } };
    },
  },
  man: {
    usage: "man <command|keys>",
    summary: "the manual for a command",
    manual: ["Show the manual page for a command. You are reading one.", "'man keys' lists every keyboard shortcut."],
    run: (args) => {
      const name = args[0]?.toLowerCase();
      if (!name) return err("what manual page do you want? try 'man ls'");
      if (name === "keys") return { lines: keysPage() };
      const command = COMMANDS[name];
      if (!command) return err(`no manual entry for ${args[0]}`);
      return {
        lines: [
          { text: `${name.toUpperCase()}(1)`, tone: "accent" },
          { text: `usage: ${command.usage}` },
          { text: "" },
          ...command.manual.map((text) => ({ text })),
        ],
      };
    },
  },
  exit: {
    usage: "exit",
    summary: "close the terminal",
    manual: ["Close the terminal window."],
    run: (_args, ctx) => {
      ctx.actions.exit();
      return { lines: [] };
    },
  },
};

/** Every keyboard shortcut, grouped by where it works. */
function keysPage(): Line[] {
  const width = Math.max(...Object.values(SHORTCUTS).map((s) => s.label.length)) + 2;
  return [
    { text: "KEYS(7)", tone: "accent" },
    ...shortcutsByPlace().flatMap(([where, shortcuts]) => [
      { text: "" },
      { text: where, tone: "dim" as const },
      ...shortcuts.map((s) => ({ text: `  ${s.label.padEnd(width)}${s.description.toLowerCase()}` })),
    ]),
  ];
}

/** Easter eggs: answered, but not listed in `help`. */
const HIDDEN: Record<string, string> = {
  sudo: "you're already root here. nothing to escalate.",
  rm: "rm: this filesystem is read-only. the past is preserved.",
  vim: "vim: not installed. you'd never get out anyway.",
  emacs: "emacs: not installed.",
};

/** Hidden commands that act: they run like any other, but `help` and Tab don't know them. */
const HIDDEN_COMMANDS: Record<string, Command> = {
  sl: {
    usage: "sl",
    summary: "a train",
    manual: [],
    run: () => out(...TRAIN),
  },
  cmatrix: {
    usage: "cmatrix",
    summary: "digital rain",
    manual: [],
    run: () => ({ lines: [], effect: { name: "matrix" } }),
  },
  panic: {
    usage: "panic",
    summary: "crash the terminal",
    manual: [],
    run: (_args, ctx) => {
      ctx.actions.panic();
      return err("kernel panic - not syncing: you asked for it");
    },
  },
};

export const COMMAND_NAMES: readonly string[] = Object.keys(COMMANDS);

/** Split on whitespace, keeping single- or double-quoted runs together. */
export function tokenize(input: string): string[] {
  const tokens: string[] = [];
  for (const match of input.matchAll(/"([^"]*)"|'([^']*)'|(\S+)/g)) {
    tokens.push(match[1] ?? match[2] ?? match[3] ?? "");
  }
  return tokens;
}

export function prompt(ctx: Pick<ShellContext, "user" | "host" | "cwd" | "home">): string {
  return `${ctx.user}@${ctx.host}:${formatPath(ctx.cwd, ctx.home)}$`;
}

export function execute(input: string, ctx: ShellContext): ShellResult {
  const [name, ...args] = tokenize(input);
  if (!name) return { lines: [] };
  const command = COMMANDS[name.toLowerCase()] ?? HIDDEN_COMMANDS[name.toLowerCase()];
  if (command) return command.run(args, ctx);
  const egg = HIDDEN[name.toLowerCase()];
  if (egg) return { lines: [{ text: egg, tone: "dim" }] };
  return err(`${name}: command not found. type 'help'`);
}

function commonPrefix(words: readonly string[]): string {
  const [first = "", ...rest] = words;
  let end = first.length;
  for (const word of rest) {
    while (!word.startsWith(first.slice(0, end))) end -= 1;
  }
  return first.slice(0, end);
}

/**
 * Tab completion. Completes command names in first position, and app ids,
 * setting values or paths after that. Returns the new input and, when the
 * completion is ambiguous, the options to show.
 */
export function complete(input: string, ctx: ShellContext): { input: string; options: string[] } {
  const startsNewWord = input === "" || /\s$/.test(input);
  const words = input.split(/\s+/).filter(Boolean);
  const partial = startsNewWord ? "" : (words.pop() ?? "");
  const command = words[0]?.toLowerCase();

  let candidates: string[];
  let base = "";
  if (!command) {
    candidates = [...COMMAND_NAMES];
  } else if (command === "theme") {
    candidates = [...THEMES];
  } else if (command === "crt") {
    candidates = [...CRT_MODES];
  } else if (command === "grid") {
    candidates = [...GRID_SPEEDS];
  } else if (command === "man") {
    candidates = [...COMMAND_NAMES];
  } else {
    const slash = partial.lastIndexOf("/");
    base = slash >= 0 ? partial.slice(0, slash + 1) : "";
    const node = nodeAt(ctx.root, resolvePath(ctx.cwd, ctx.home, base || "."));
    candidates = node?.kind === "dir" ? listDir(node).map((name) => base + name) : [];
    if (command === "open" && !base) candidates.unshift(...ctx.apps.map((app) => app.id));
  }

  const matches = [...new Set(candidates.filter((c) => c.startsWith(partial)))];
  const head = input.slice(0, input.length - partial.length);
  if (matches.length === 0) return { input, options: [] };
  if (matches.length === 1) {
    const [only = ""] = matches;
    return { input: head + only + (only.endsWith("/") ? "" : " "), options: [] };
  }
  const prefix = commonPrefix(matches);
  return {
    input: head + (prefix.length > partial.length ? prefix : partial),
    options: matches.map((m) => m.slice(base.length)),
  };
}
