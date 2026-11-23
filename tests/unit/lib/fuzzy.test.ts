import { describe, expect, it } from "vitest";
import { fuzzyMatch, fuzzyRank } from "@lib/fuzzy";

describe("fuzzyMatch", () => {
  it("matches characters in order, case-insensitively", () => {
    expect(fuzzyMatch("msw", "Minesweeper")?.indices).toEqual([0, 4, 5]);
    expect(fuzzyMatch("wsm", "Minesweeper")).toBeNull();
  });

  it("matches everything with an empty query", () => {
    expect(fuzzyMatch("  ", "anything")).toEqual({ score: 0, indices: [] });
  });

  it("scores word starts and runs above scattered letters", () => {
    const start = fuzzyMatch("term", "Terminal")!.score;
    const scattered = fuzzyMatch("term", "The extra rumble")!.score;
    expect(start).toBeGreaterThan(scattered);
  });
});

describe("fuzzyRank", () => {
  const items = ["Theme: Dark", "Terminal", "Contact"];

  it("puts the best match first and drops non-matches", () => {
    expect(fuzzyRank(items, "term", (s) => s)).toEqual(["Terminal"]);
    // Both start with "t"; the shorter text wins the tie, and "Contact" only has it mid-word.
    expect(fuzzyRank(items, "t", (s) => s)).toEqual(["Terminal", "Theme: Dark", "Contact"]);
  });

  it("keeps the original order for an empty query", () => {
    expect(fuzzyRank(items, "", (s) => s)).toEqual(items);
  });
});
