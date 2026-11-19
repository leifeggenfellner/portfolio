/**
 * Minesweeper pixel art. Cell sprites are 12×12 and faces 16×16, drawn at
 * whole multiples so the pixels stay square.
 */

export const MINE = [
  ".....##.....",
  ".#..####..#.",
  "..########..",
  "..#ww#####..",
  ".##ww######.",
  "############",
  "############",
  ".##########.",
  "..########..",
  "..########..",
  ".#..####..#.",
  ".....##.....",
];

export const FLAG = [
  "............",
  ".....rr.....",
  "...rrrr.....",
  ".rrrrrr.....",
  "...rrrr.....",
  ".....rr.....",
  "......#.....",
  "......#.....",
  "......#.....",
  "....####....",
  "..########..",
  "............",
];

/** Drawn over a mine where the player planted a wrong flag. */
export const CROSS = [
  "xx........xx",
  "xxx......xxx",
  ".xxx....xxx.",
  "..xxx..xxx..",
  "...xxxxxx...",
  "....xxxx....",
  "....xxxx....",
  "...xxxxxx...",
  "..xxx..xxx..",
  ".xxx....xxx.",
  "xxx......xxx",
  "xx........xx",
];

const FACE_TOP = [".....######.....", "...##yyyyyy##...", "..#yyyyyyyyyy#..", ".#yyyyyyyyyyyy#."];
const FACE_BOTTOM = [
  ".#yyyyyyyyyyyy#.",
  "..#yyyyyyyyyy#..",
  "...##yyyyyy##...",
  ".....######.....",
  "................",
];
const EYES = [".#yyy##yy##yyy#.", "#yyyy##yy##yyyy#", "#yyyyyyyyyyyyyy#"];

export const FACES = {
  ready: [
    ...FACE_TOP,
    ...EYES,
    "#yyyyyyyyyyyyyy#",
    "#yyyyyyyyyyyyyy#",
    "#yyy#yyyyyy#yyy#",
    ".#yyy######yyy#.",
    ...FACE_BOTTOM,
  ],
  pressing: [
    ...FACE_TOP,
    ...EYES,
    "#yyyyyyyyyyyyyy#",
    "#yyyyyyyyyyyyyy#",
    "#yyyyyy##yyyyyy#",
    ".#yyyy#yy#yyyy#.",
    ".#yyyyy##yyyyy#.",
    ...FACE_BOTTOM.slice(1),
  ],
  lost: [
    ...FACE_TOP,
    ".#yy#y#yy#y#yy#.",
    "#yyyy#yyyy#yyyy#",
    "#yyy#y#yy#y#yyy#",
    "#yyyyyyyyyyyyyy#",
    "#yyyyyyyyyyyyyy#",
    "#yyyyyyyyyyyyyy#",
    ".#yyyy####yyyy#.",
    ".#yyy#yyyy#yyy#.",
    ...FACE_BOTTOM.slice(1),
  ],
  won: [
    ...FACE_TOP,
    ".#y##########y#.",
    "#yyy###yy###yyy#",
    "#yyyyyyyyyyyyyy#",
    "#yyyyyyyyyyyyyy#",
    "#yyyyyyyyyyyyyy#",
    "#yyy#yyyyyy#yyy#",
    ".#yyy######yyy#.",
    ...FACE_BOTTOM,
  ],
} as const;
