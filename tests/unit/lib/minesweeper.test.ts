import { describe, expect, it } from "vitest";
import { chord, minesLeft, neighbours, newGame, placeMines, reveal, toggleFlag } from "@lib/minesweeper";
import type { Game } from "@lib/minesweeper";

/** A 3×3 board with one mine in the top-left corner, already in play. */
function cornerMine(): Game {
  const game = newGame(3, 3, 1);
  const cells = game.cells.map((cell, i) => ({ ...cell, mine: i === 0 }));
  for (const [i, cell] of cells.entries()) {
    cell.adjacent = neighbours(3, 3, i).filter((n) => n === 0).length;
  }
  return { ...game, mines: 1, cells, status: "playing" };
}

/** Deterministic stand-in for Math.random. */
function seeded(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

describe("minesweeper", () => {
  it("finds the neighbours of corner, edge and middle cells", () => {
    expect(neighbours(3, 3, 0).sort()).toEqual([1, 3, 4]);
    expect(neighbours(3, 3, 1)).toHaveLength(5);
    expect(neighbours(3, 3, 4)).toHaveLength(8);
  });

  it("keeps the first click and its neighbours clear of mines", () => {
    for (let seed = 1; seed < 40; seed += 1) {
      const game = placeMines(newGame(9, 9, 10), 40, seeded(seed));
      const clear = [40, ...neighbours(9, 9, 40)];
      expect(clear.every((i) => !game.cells[i]?.mine)).toBe(true);
      expect(game.cells.filter((c) => c.mine)).toHaveLength(10);
    }
  });

  it("counts adjacent mines", () => {
    const game = placeMines(newGame(9, 9, 10), 40, seeded(7));
    for (const [i, cell] of game.cells.entries()) {
      const expected = neighbours(9, 9, i).filter((n) => game.cells[n]?.mine).length;
      expect(cell.adjacent).toBe(expected);
    }
  });

  it("opens an area on the first reveal and starts play", () => {
    const game = reveal(newGame(9, 9, 10), 40, seeded(3));
    expect(game.status).toBe("playing");
    expect(game.cells.filter((c) => c.state === "revealed").length).toBeGreaterThan(1);
  });

  it("flood-reveals empty space and wins when only mines remain", () => {
    const game = reveal(cornerMine(), 8);
    expect(game.status).toBe("won");
    expect(game.cells[0]?.state).toBe("flagged");
    expect(minesLeft(game)).toBe(0);
  });

  it("loses on a mine, shows every mine and records which one went off", () => {
    const game = reveal(cornerMine(), 0);
    expect(game.status).toBe("lost");
    expect(game.exploded).toBe(0);
    expect(reveal(game, 8)).toBe(game);
  });

  it("toggles flags on hidden cells only, and flags block reveals", () => {
    let game = toggleFlag(cornerMine(), 0);
    expect(game.cells[0]?.state).toBe("flagged");
    expect(minesLeft(game)).toBe(0);
    expect(reveal(game, 0)).toBe(game);
    game = toggleFlag(game, 0);
    expect(game.cells[0]?.state).toBe("hidden");
  });

  it("chords only when the flags match the number", () => {
    let game = reveal(cornerMine(), 1);
    expect(chord(game, 1)).toBe(game);
    game = chord(toggleFlag(game, 0), 1);
    expect(game.cells[2]?.state).toBe("revealed");
    expect(game.status).toBe("won");
  });

  it("chording onto a wrong flag sets off the mine", () => {
    let game = reveal(cornerMine(), 1);
    game = chord(toggleFlag(game, 3), 1);
    expect(game.status).toBe("lost");
  });
});
