/**
 * The BIOS log's text: one line per real loading task, laid out for a
 * monospace screen as
 *
 *   Loading apps.......... 3/7 [####      ] 41.2 KB  OK
 *
 * The shell renders the parts; narrow screens hide the bar and the size.
 */

export type LineStatus = "wait" | "run" | "ok" | "err" | "skip" | "bg";

/** A task's state as the log shows it. */
export interface LogLine {
  id: string;
  label: string;
  status: LineStatus;
  done?: number;
  total?: number;
  bytes?: number;
  /** Replaces the count and the bar, e.g. "8 cores" or "on demand". */
  note?: string;
}

/** Labels pad to this many characters with dots. */
export const LABEL_COLUMNS = 22;
/** Characters inside the progress bar's brackets. */
export const BAR_COLUMNS = 10;

/** "Loading apps" → "Loading apps.........." to `columns` characters, always with at least two dots. */
export function leader(label: string, columns = LABEL_COLUMNS): string {
  return label + ".".repeat(Math.max(2, columns - label.length));
}

/** `[####      ]` for done/total, rounded down so it only shows full once everything is. */
export function bar(done: number, total: number, columns = BAR_COLUMNS): string {
  const filled = total > 0 ? Math.min(columns, Math.floor((done / total) * columns)) : 0;
  return `[${"#".repeat(filled)}${" ".repeat(columns - filled)}]`;
}

/** Bytes as the log prints them: "512 B", "41.2 KB", "1.2 MB". */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** What a status reads as at the end of the line. */
export const STATUS_TEXT: Record<LineStatus, string> = {
  wait: "",
  run: "",
  ok: "OK",
  err: "ERR",
  skip: "--",
  bg: "...",
};

/** How far along a line is, 0 to 1, for the overall progress bar. */
export function lineFraction(line: LogLine): number {
  if (line.status === "wait") return 0;
  if (line.status === "run") return line.total ? Math.min(1, (line.done ?? 0) / line.total) : 0;
  return 1;
}

/** Overall progress in whole percent across `lines`. */
export function overallPercent(lines: readonly LogLine[]): number {
  if (lines.length === 0) return 0;
  const sum = lines.reduce((total, line) => total + lineFraction(line), 0);
  return Math.floor((sum / lines.length) * 100);
}
