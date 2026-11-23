/**
 * Minesweeper rules, kept free of any UI so they can be tested directly.
 *
 * Every operation returns a new game rather than mutating, so a component can
 * hold the game in one piece of state. Mines are placed on the first reveal,
 * away from the clicked cell and its neighbours, so the opening move is always
 * safe and always opens an area.
 */

export type CellState = "hidden" | "revealed" | "flagged";
export type GameStatus = "ready" | "playing" | "won" | "lost";

export interface Cell {
  mine: boolean;
  /** Mines among the eight neighbours. */
  adjacent: number;
  state: CellState;
}

export interface Game {
  rows: number;
  cols: number;
  mines: number;
  cells: Cell[];
  status: GameStatus;
  /** The mine that ended the game, if one did. */
  exploded: number | null;
}

export const BEGINNER = { rows: 9, cols: 9, mines: 10 } as const;

export function newGame(rows: number, cols: number, mines: number): Game {
  const cells = Array.from({ length: rows * cols }, (): Cell => ({ mine: false, adjacent: 0, state: "hidden" }));
  return { rows, cols, mines: Math.min(mines, rows * cols - 9), cells, status: "ready", exploded: null };
}

export function neighbours(rows: number, cols: number, index: number): number[] {
  const row = Math.floor(index / cols);
  const col = index % cols;
  const out: number[] = [];
  for (let dr = -1; dr <= 1; dr += 1) {
    for (let dc = -1; dc <= 1; dc += 1) {
      if (dr === 0 && dc === 0) continue;
      const r = row + dr;
      const c = col + dc;
      if (r >= 0 && r < rows && c >= 0 && c < cols) out.push(r * cols + c);
    }
  }
  return out;
}

/** Lay mines anywhere except `safe` and its neighbours, then count adjacency. */
export function placeMines(game: Game, safe: number, random: () => number = Math.random): Game {
  const keepClear = new Set([safe, ...neighbours(game.rows, game.cols, safe)]);
  const order = game.cells
    .map((_, i) => ({ i, key: random() }))
    .filter(({ i }) => !keepClear.has(i))
    .sort((a, b) => a.key - b.key);
  const mined = new Set(order.slice(0, game.mines).map(({ i }) => i));
  const cells = game.cells.map((cell, i) => ({
    ...cell,
    mine: mined.has(i),
    adjacent: neighbours(game.rows, game.cols, i).filter((n) => mined.has(n)).length,
  }));
  return { ...game, cells, status: "playing" };
}

function isOver(game: Game): boolean {
  return game.status === "won" || game.status === "lost";
}

/** Open the given cells, flooding outward from any that touch no mines. */
function open(game: Game, start: number[]): Game {
  const cells = game.cells.map((cell) => ({ ...cell }));
  const queue = [...start];
  let hit: number | null = null;
  for (let i = queue.pop(); i !== undefined; i = queue.pop()) {
    const cell = cells[i];
    if (!cell || cell.state !== "hidden") continue;
    cell.state = "revealed";
    if (cell.mine) {
      hit ??= i;
      continue;
    }
    if (cell.adjacent === 0) queue.push(...neighbours(game.rows, game.cols, i));
  }

  if (hit !== null) {
    for (const cell of cells) if (cell.mine && cell.state === "hidden") cell.state = "revealed";
    return { ...game, cells, status: "lost", exploded: hit };
  }
  const cleared = cells.every((cell) => cell.mine || cell.state === "revealed");
  if (cleared) {
    for (const cell of cells) if (cell.mine) cell.state = "flagged";
    return { ...game, cells, status: "won" };
  }
  return { ...game, cells };
}

export function reveal(game: Game, index: number, random?: () => number): Game {
  if (isOver(game) || game.cells[index]?.state !== "hidden") return game;
  const armed = game.status === "ready" ? placeMines(game, index, random) : game;
  return open(armed, [index]);
}

export function toggleFlag(game: Game, index: number): Game {
  const cell = game.cells[index];
  if (isOver(game) || !cell || cell.state === "revealed") return game;
  const cells = game.cells.slice();
  cells[index] = { ...cell, state: cell.state === "flagged" ? "hidden" : "flagged" };
  return { ...game, cells };
}

/**
 * On a revealed number whose mines are all flagged, open every other
 * neighbour at once. Anything else is a no-op.
 */
export function chord(game: Game, index: number): Game {
  const cell = game.cells[index];
  if (isOver(game) || !cell || cell.state !== "revealed" || cell.adjacent === 0) return game;
  const around = neighbours(game.rows, game.cols, index);
  const flags = around.filter((n) => game.cells[n]?.state === "flagged").length;
  if (flags !== cell.adjacent) return game;
  return open(
    game,
    around.filter((n) => game.cells[n]?.state === "hidden"),
  );
}

/** Mines minus flags; may go negative when the player over-flags, as in the original. */
export function minesLeft(game: Game): number {
  return game.mines - game.cells.filter((cell) => cell.state === "flagged").length;
}
