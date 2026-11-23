import { describe, expect, it } from "vitest";
import { FORTUNES, monitorSays, wrap } from "@apps/terminal/toys";

describe("wrap", () => {
  it("breaks on spaces within the width", () => {
    expect(wrap("the quick brown fox jumps", 10)).toEqual(["the quick", "brown fox", "jumps"]);
  });

  it("splits words longer than the width", () => {
    expect(wrap("abcdefghij", 4)).toEqual(["abcd", "efgh", "ij"]);
  });

  it("returns one empty line for empty text", () => {
    expect(wrap("   ", 10)).toEqual([""]);
  });
});

describe("monitorSays", () => {
  it("puts one line in angle brackets", () => {
    const art = monitorSays("hello");
    expect(art.slice(0, 3)).toEqual([" _______", "< hello >", " -------"]);
    expect(art.join("\n")).toContain("[o][o]");
  });

  it("draws a multi-line bubble with matching edges", () => {
    const [top, first, middle, last, bottom] = monitorSays("one two three four five", 9);
    expect(first).toMatch(/^\/ .* \\$/);
    expect(middle).toMatch(/^\| .* \|$/);
    expect(last).toMatch(/^\\ .* \/$/);
    for (const line of [first, middle, last]) expect(line!.length).toBe(top!.length + 1);
    expect(bottom!.length).toBe(top!.length);
  });
});

describe("fortunes", () => {
  it("are all one line, short enough for the default terminal", () => {
    for (const fortune of FORTUNES) expect(fortune.length).toBeLessThanOrEqual(90);
  });
});
