// Draws the desktop's pixel-art cursors from the grids below into
// src/assets/cursors/*.svg, in the same style as the 16px app icons: a hard
// dark outline, crisp edges, drawn on a 16px grid and shown at 32px.
// Run `node scripts/build-cursors.mjs` after editing a grid.
import { writeFileSync } from "node:fs";
import path from "node:path";

const PALETTE = {
  o: "#0a0618", // outline: the terminal's near-black, readable on light and dark
  w: "#ffffff",
  c: "#1fb6d6", // cyan
  m: "#e83fb0", // magenta
  y: "#ffd23f", // the smiley's yellow
};

/** Adds the dark outline around every filled pixel (its four neighbours), so the edge is even everywhere. */
function outlined(grid) {
  const filled = (x, y) => grid[y]?.[x] !== undefined && grid[y][x] !== "." && grid[y][x] !== "o";
  return grid.map((row, y) =>
    [...row]
      .map((char, x) =>
        char !== "."
          ? char
          : [
                [x - 1, y],
                [x + 1, y],
                [x, y - 1],
                [x, y + 1],
              ].some(([a, b]) => filled(a, b))
            ? "o"
            : ".",
      )
      .join(""),
  );
}

const CURSORS = {
  arrow: [
    "o...............",
    "oo..............",
    "owo.............",
    "owwo............",
    "owwwo...........",
    "owwwwo..........",
    "owwwwwo.........",
    "owwwwwwo........",
    "owwwwwwwo.......",
    "owwwwwwwwo......",
    "owwwwwoooo......",
    "owwowwo.........",
    "owo.owwo........",
    "oo..owwo........",
    "o....owwo.......",
    ".....ooo........",
  ],
  hand: [
    ".....oo.........",
    "....owwo........",
    "....owwo........",
    "....owwo........",
    "....owwooo......",
    "....owwowwoo....",
    "....owwowwowoo..",
    ".oo.owwowwowwo..",
    "owwoowwwwwwwwo..",
    "owwwowwwwwwwwo..",
    ".owwwwwwwwwwwo..",
    "..owwwwwwwwwwo..",
    "..owwwwwwwwwo...",
    "...owwwwwwwwo...",
    "....owwwwwwo....",
    "....oooooooo....",
  ],
  text: [
    "oooo.oooo.......",
    "owwwowwwo.......",
    "ooowwwooo.......",
    "...owo..........",
    "...owo..........",
    "...owo..........",
    "...owo..........",
    "...owo..........",
    "...owo..........",
    "...owo..........",
    "...owo..........",
    "...owo..........",
    "...owo..........",
    "ooowwwooo.......",
    "owwwowwwo.......",
    "oooo.oooo.......",
  ],
  // Fill only; outlined() below adds the dark edge around every filled pixel.
  move: outlined([
    "................",
    ".......w........",
    "......www.......",
    ".....wwwww......",
    ".......w........",
    ".......w........",
    "..w....w....w...",
    ".wwwwwwwwwwwww..",
    "..w....w....w...",
    ".......w........",
    ".......w........",
    ".....wwwww......",
    "......www.......",
    ".......w........",
    "................",
    "................",
  ]),
  resize: outlined([
    "................",
    ".wwwww..........",
    ".wwww...........",
    ".www............",
    ".ww.w...........",
    ".w...w..........",
    "......w.........",
    ".......w........",
    "........w.......",
    ".........w......",
    "..........w...w.",
    "...........w.ww.",
    "............www.",
    "...........wwww.",
    "..........wwwww.",
    "................",
  ]),
  busy: [
    "oooooooooooo....",
    "owwwwwwwwwwo....",
    "oooooooooooo....",
    ".owcccccccwo....",
    ".owwcccccwwo....",
    "..owwcccwwo.....",
    "...owwcwwo......",
    "....owcwo.......",
    "...owwcwwo......",
    "..owwwcwwwo.....",
    ".owwwwcwwwwo....",
    ".owwcccccwwo....",
    "oooooooooooo....",
    "owwwwwwwwwwo....",
    "oooooooooooo....",
    "................",
  ],
};

function svg(grid) {
  const byColor = {};
  grid.forEach((row, y) => {
    for (let x = 0; x < row.length; ) {
      const char = row[x];
      let end = x;
      while (row[end] === char) end += 1;
      if (char !== ".") (byColor[char] ??= []).push(`M${x} ${y}h${end - x}v1h-${end - x}z`);
      x = end;
    }
  });
  const paths = Object.entries(byColor)
    .map(([char, d]) => `<path fill="${PALETTE[char]}" d="${d.join("")}"/>`)
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 16 16" shape-rendering="crispEdges">${paths}</svg>\n`;
}

const out = path.resolve(import.meta.dirname, "../src/assets/cursors");
for (const [name, grid] of Object.entries(CURSORS)) {
  if (grid.length !== 16 || grid.some((row) => row.length !== 16)) throw new Error(`${name}: grids are 16x16`);
  writeFileSync(path.join(out, `${name}.svg`), svg(grid));
}
console.log(`wrote ${Object.keys(CURSORS).length} cursors to ${path.relative(process.cwd(), out)}`);
