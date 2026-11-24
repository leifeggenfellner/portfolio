import { describe, expect, it } from "vitest";
import { bar, formatBytes, leader, overallPercent } from "@lib/boot-log";
import type { LogLine } from "@lib/boot-log";

describe("boot log", () => {
  it("pads labels with dots to one column, and never runs a long one into its value", () => {
    expect(leader("Loading apps", 16)).toBe("Loading apps....");
    expect(leader("Caching for offline", 16)).toBe("Caching for offline..");
  });

  it("fills the bar only when everything is done", () => {
    expect(bar(0, 7, 10)).toBe("[          ]");
    expect(bar(6, 7, 10)).toBe("[########  ]");
    expect(bar(7, 7, 10)).toBe("[##########]");
    expect(bar(9, 7, 10)).toBe("[##########]");
    expect(bar(0, 0, 4)).toBe("[    ]");
  });

  it("prints sizes in the unit that reads best", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(42_200)).toBe("41.2 KB");
    expect(formatBytes(1_300_000)).toBe("1.2 MB");
  });

  it("counts a running task by its share done, and an ended one as whole", () => {
    const line = (status: LogLine["status"], done?: number, total?: number): LogLine => ({
      id: status,
      label: status,
      status,
      done,
      total,
    });
    expect(overallPercent([])).toBe(0);
    expect(overallPercent([line("ok"), line("wait")])).toBe(50);
    expect(overallPercent([line("run", 1, 4), line("err"), line("skip"), line("bg")])).toBe(81);
  });
});
