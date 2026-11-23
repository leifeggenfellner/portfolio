/**
 * The `pipes` toy: pipes grow across a grid one cell per step, turning now
 * and then, each in its own colour. Pure and seeded, so the pattern can be
 * tested; the Terminal only draws the pieces this returns.
 */

/** Travel directions: up, right, down, left. */
export type Dir = 0 | 1 | 2 | 3;

const DX = [0, 1, 0, -1] as const;
const DY = [-1, 0, 1, 0] as const;

/** The side a pipe arriving while travelling `dir` enters a cell from. */
export const opposite = (dir: Dir): Dir => ((dir + 2) % 4) as Dir;

/** One cell of pipe: where it came in, where it goes out, and its colour. */
export interface Piece {
  x: number;
  y: number;
  /** Side of the cell the pipe enters from. */
  enter: Dir;
  /** Side of the cell it leaves through. */
  exit: Dir;
  color: number;
}

export interface PipesOptions {
  cols: number;
  rows: number;
  /** Pipes growing at once. */
  count: number;
  /** Number of colours to cycle through. */
  colors: number;
  /** A number in [0, 1), as Math.random. */
  random: () => number;
  /** Chance per step that a pipe turns. */
  turnChance?: number;
  /** Share of the grid drawn before the screen clears and starts again. */
  fill?: number;
}

interface Pipe {
  x: number;
  y: number;
  dir: Dir;
  color: number;
}

export interface PipesStep {
  pieces: Piece[];
  /** The screen is full: clear it before drawing `pieces`. */
  reset: boolean;
}

export function createPipes({ cols, rows, count, colors, random, turnChance = 0.15, fill = 0.6 }: PipesOptions) {
  const pick = (n: number) => Math.floor(random() * n);
  const spawn = (): Pipe => ({ x: pick(cols), y: pick(rows), dir: pick(4) as Dir, color: pick(colors) });
  let pipes = Array.from({ length: count }, spawn);
  let drawn = 0;

  function step(): PipesStep {
    const reset = drawn >= cols * rows * fill;
    if (reset) {
      drawn = 0;
      pipes = Array.from({ length: count }, spawn);
    }
    const pieces = pipes.map((pipe) => {
      const turn = random() < turnChance ? (random() < 0.5 ? 1 : 3) : 0;
      const next = ((pipe.dir + turn) % 4) as Dir;
      const piece: Piece = { x: pipe.x, y: pipe.y, enter: opposite(pipe.dir), exit: next, color: pipe.color };
      pipe.dir = next;
      // Off one edge, back in at the other, as the classic does.
      pipe.x = (pipe.x + DX[next] + cols) % cols;
      pipe.y = (pipe.y + DY[next] + rows) % rows;
      return piece;
    });
    drawn += pieces.length;
    return { pieces, reset };
  }

  return { step };
}

/** Seeded random numbers (mulberry32), so tests and screenshots repeat. */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pipes to grow for `pipes [count]`: 1 to 8, default 4. */
export function pipeCount(arg: string | undefined): number | null {
  if (arg === undefined) return 4;
  const n = Number(arg);
  return Number.isInteger(n) && n >= 1 && n <= 8 ? n : null;
}
