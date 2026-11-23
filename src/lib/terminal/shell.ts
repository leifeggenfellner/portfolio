/**
 * The terminal's command interpreter. Pure: it reads a context and returns
 * the lines to print plus any state change, and reaches the rest of the site
 * only through the `actions` the caller provides.
 */
import { CRT_MODES, GRID_SPEEDS, THEMES } from "@lib/settings";
import { formatPath, listDir, nodeAt, resolvePath } from "./fs";
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
}

export interface ShellResult {
  lines: Line[];
  cwd?: string[];
  clear?: boolean;
}

interface Command {
  usage: string;
  summary: string;
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
    run: (_args, ctx) => out(`/${ctx.cwd.join("/")}`),
  },
  cat: {
    usage: "cat <file>",
    summary: "print a file",
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
    run: (_args, ctx) => out(...ctx.whoami),
  },
  neofetch: {
    usage: "neofetch",
    summary: "system summary",
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
    run: settingCommand("theme", THEMES, (actions, value) => actions.setTheme(value)),
  },
  crt: {
    usage: "crt <off|subtle|full>",
    summary: "scanline strength",
    run: settingCommand("crt", CRT_MODES, (actions, value) => actions.setCrt(value)),
  },
  grid: {
    usage: "grid <paused|slow|…>",
    summary: "horizon grid speed",
    run: settingCommand("grid", GRID_SPEEDS, (actions, value) => actions.setGridSpeed(value)),
  },
  history: {
    usage: "history",
    summary: "previous commands",
    run: (_args, ctx) => out(...ctx.history.map((cmd, i) => `${String(i + 1).padStart(4)}  ${cmd}`)),
  },
  echo: {
    usage: "echo <text>",
    summary: "print text",
    run: (args) => out(args.join(" ")),
  },
  date: {
    usage: "date",
    summary: "current date and time",
    run: (_args, ctx) => out(ctx.now().toString()),
  },
  clear: {
    usage: "clear",
    summary: "clear the screen",
    run: () => ({ lines: [], clear: true }),
  },
  exit: {
    usage: "exit",
    summary: "close the terminal",
    run: (_args, ctx) => {
      ctx.actions.exit();
      return { lines: [] };
    },
  },
};

/** Easter eggs: answered, but not listed in `help`. */
const HIDDEN: Record<string, string> = {
  sudo: "you're already root here. nothing to escalate.",
  rm: "rm: this filesystem is read-only. the past is preserved.",
  vim: "vim: not installed. you'd never get out anyway.",
  emacs: "emacs: not installed.",
};

/** Hidden commands that act: they run like any other, but `help` and Tab don't know them. */
const HIDDEN_COMMANDS: Record<string, Command> = {
  panic: {
    usage: "panic",
    summary: "crash the terminal",
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
