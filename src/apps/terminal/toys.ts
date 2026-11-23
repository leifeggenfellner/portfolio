/**
 * Terminal toys: fortunes, a talking monitor and a train. Pure text, written
 * for this site; the art is original rather than the classic cow or train.
 */

export const FORTUNES: readonly string[] = [
  "The bug is in the last place you look, because then you stop looking.",
  "A static site never goes down at 3 a.m. It just quietly goes out of date.",
  "Every window on this desktop can be closed with Esc. Most problems can't.",
  "Today's forecast: 100% chance of scanlines.",
  "Try 'theme dark' after sunset. Your eyes will thank you.",
  "It works on my machine. This machine, specifically: try 'neofetch'.",
  "Naming things is hard. Naming this OS took longer than building the window manager.",
  "The first click in Minesweeper is always safe. Life offers no such guarantee.",
  "Weeks of coding can save you hours of planning.",
  "Right-click the desktop. There is more here than meets the eye.",
  "A clean commit history is a love letter to your future self.",
  "Nothing here is fake. Except the filesystem. And the disk. And the CRT.",
];

/** Wraps `text` to lines of at most `width` characters, breaking on spaces where it can. */
export function wrap(text: string, width: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    for (let rest = word; rest; ) {
      const room = line ? width - line.length - 1 : width;
      if (rest.length <= room) {
        line = line ? `${line} ${rest}` : rest;
        rest = "";
      } else if (line) {
        lines.push(line);
        line = "";
      } else {
        lines.push(rest.slice(0, width));
        rest = rest.slice(width);
      }
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

const MONITOR = [
  "    \\",
  "     \\   .--------.",
  "         | [o][o] |",
  "         |   ==   |",
  "         '--------'",
  "          _|____|_",
];

/** A speech bubble over a small talking monitor. */
export function monitorSays(text: string, width = 36): string[] {
  const lines = wrap(text, width);
  const inner = Math.max(...lines.map((l) => l.length));
  const pad = (l: string) => l.padEnd(inner);
  const body =
    lines.length === 1
      ? [`< ${pad(lines[0] ?? "")} >`]
      : lines.map((l, i) => {
          const [open, close] = i === 0 ? ["/", "\\"] : i === lines.length - 1 ? ["\\", "/"] : ["|", "|"];
          return `${open} ${pad(l)} ${close}`;
        });
  return [` ${"_".repeat(inner + 2)}`, ...body, ` ${"-".repeat(inner + 2)}`, ...MONITOR];
}

export const TRAIN: readonly string[] = [
  "        ____",
  "  ___  |[] |______",
  " |___|_|___|_____|]",
  "  O-O    O-O   O-O   choo choo. you meant 'ls'.",
];
