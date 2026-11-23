/**
 * Every keyboard shortcut, described once. Keymap bindings take their keys
 * and description from here, and the help note, the Terminal's `man keys`
 * and docs/keyboard.md (`pnpm docs:generate`) are generated from it.
 *
 * No imports: the docs script runs this file under plain Node.
 */

export type ShortcutScope = "modal" | "window" | "desktop" | "global";

export interface Shortcut {
  /** Chords as the keymap matches them (`Mod` is Ctrl, or Cmd on a Mac). */
  keys: readonly string[];
  /** As people read it, e.g. "Ctrl+K". */
  label: string;
  description: string;
  /** Where it works. */
  where: string;
  /** For keymap bindings; absent for keys a component handles itself (menus, fields). */
  scope?: ShortcutScope;
}

export const SHORTCUTS = {
  palette: {
    keys: ["Mod+K", "Mod+Shift+K"],
    label: "Ctrl+K",
    description: "Open or close the command palette",
    where: "Desktop",
    scope: "desktop",
  },
  snap: {
    keys: ["Alt+Shift+ArrowLeft", "Alt+Shift+ArrowRight", "Alt+Shift+ArrowUp", "Alt+Shift+ArrowDown"],
    label: "Alt+Shift+Arrows",
    description: "Snap the active window left or right, maximise, restore",
    where: "Desktop",
    scope: "window",
  },
  bootSkip: {
    keys: ["Escape", "Enter", " "],
    label: "Esc / Enter / Space",
    description: "Skip the boot sequence",
    where: "Boot",
    scope: "modal",
  },
  iconOpen: {
    keys: ["Enter"],
    label: "Enter",
    description: "Open the selected icon",
    where: "Desktop icons",
  },
  iconMove: {
    keys: ["ArrowUp", "ArrowDown", "Home", "End"],
    label: "Arrows / Home / End",
    description: "Move between desktop icons",
    where: "Desktop icons",
  },
  closeWindow: {
    keys: ["Escape"],
    label: "Esc",
    description: "Close the focused window",
    where: "Windows",
  },
  titleBarSnap: {
    keys: ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"],
    label: "Arrows",
    description: "Snap, maximise or restore the window",
    where: "Window title bar",
  },
  terminalHistory: {
    keys: ["ArrowUp", "ArrowDown"],
    label: "Up / Down",
    description: "Walk the command history",
    where: "Terminal",
  },
  terminalComplete: {
    keys: ["Tab"],
    label: "Tab",
    description: "Complete a command, path or app id",
    where: "Terminal",
  },
  terminalClear: {
    keys: ["Ctrl+L"],
    label: "Ctrl+L",
    description: "Clear the screen",
    where: "Terminal",
  },
  terminalCancel: {
    keys: ["Ctrl+C"],
    label: "Ctrl+C",
    description: "Cancel the line being typed",
    where: "Terminal",
  },
  minesweeperFlag: {
    keys: ["F", "Shift+F"],
    label: "F",
    description: "Flag the cell under the pointer or the focused cell",
    where: "Minesweeper",
    scope: "window",
  },
  minesweeperNew: {
    keys: ["F2", "N"],
    label: "F2 / N",
    description: "Start a new game",
    where: "Minesweeper",
  },
} as const satisfies Record<string, Shortcut>;

export type ShortcutId = keyof typeof SHORTCUTS;

/** The keymap part of a shortcut, to spread into a binding. */
export function bindingFor(id: ShortcutId) {
  const { keys, description, scope } = SHORTCUTS[id] as Shortcut;
  return { id, keys, description, scope: scope ?? "global" };
}

/** Every shortcut grouped by where it works, in table order. */
export function shortcutsByPlace(): [string, Shortcut[]][] {
  const groups = new Map<string, Shortcut[]>();
  for (const shortcut of Object.values(SHORTCUTS) as Shortcut[]) {
    groups.set(shortcut.where, [...(groups.get(shortcut.where) ?? []), shortcut]);
  }
  return [...groups];
}
