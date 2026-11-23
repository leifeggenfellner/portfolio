import { describe, expect, it } from "vitest";
import { createPipes, opposite, pipeCount, seededRandom } from "@lib/terminal/pipes";
import type { Piece } from "@lib/terminal/pipes";

const DX = [0, 1, 0, -1];
const DY = [-1, 0, 1, 0];

describe("pipes", () => {
  it("grows each pipe one connected cell per step, wrapping at the edges", () => {
    const cols = 8;
    const rows = 5;
    const pipes = createPipes({
      cols,
      rows,
      count: 3,
      colors: 4,
      random: seededRandom(7),
      turnChance: 0.3,
      fill: 1000,
    });
    let previous: Piece[] = pipes.step().pieces;
    for (let i = 0; i < 200; i += 1) {
      const { pieces } = pipes.step();
      pieces.forEach((piece, n) => {
        const before = previous[n]!;
        // The next piece sits where the last one's exit points, entering from the facing side.
        expect(piece.x).toBe((before.x + DX[before.exit]! + cols) % cols);
        expect(piece.y).toBe((before.y + DY[before.exit]! + rows) % rows);
        expect(piece.enter).toBe(opposite(before.exit));
        // Never a U-turn.
        expect(piece.exit).not.toBe(piece.enter);
        expect(piece.color).toBe(before.color);
      });
      previous = pieces;
    }
  });

  it("turns only sometimes", () => {
    const pipes = createPipes({ cols: 40, rows: 20, count: 1, colors: 1, random: seededRandom(1), fill: 1000 });
    const pieces = Array.from({ length: 300 }, () => pipes.step().pieces[0]!);
    const turns = pieces.filter((p) => p.exit !== opposite(p.enter)).length;
    expect(turns).toBeGreaterThan(10);
    expect(turns).toBeLessThan(150);
  });

  it("asks for a clear once the screen is filled enough", () => {
    const pipes = createPipes({ cols: 4, rows: 4, count: 2, colors: 2, random: seededRandom(3), fill: 0.5 });
    const resets = Array.from({ length: 10 }, () => pipes.step().reset);
    // 16 cells * 0.5 = 8 pieces, at 2 per step: the 5th step starts over.
    expect(resets.indexOf(true)).toBe(4);
  });

  it("repeats for the same seed", () => {
    const run = () => {
      const pipes = createPipes({ cols: 10, rows: 10, count: 2, colors: 3, random: seededRandom(42) });
      return Array.from({ length: 20 }, () => pipes.step().pieces);
    };
    expect(run()).toEqual(run());
  });

  it("parses the pipe count", () => {
    expect(pipeCount(undefined)).toBe(4);
    expect(pipeCount("8")).toBe(8);
    expect(pipeCount("0")).toBeNull();
    expect(pipeCount("nine")).toBeNull();
  });
});
