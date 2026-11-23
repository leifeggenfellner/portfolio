# Contrast exceptions

There are none. Every text surface meets WCAG AA (4.5:1 for body
text), and the `color-contrast` rule is on in every axe test.

## What axe can't measure, and how it is checked instead

axe reports text over gradients, glows and translucent layers as
"incomplete" rather than passing or failing it. On this site that is
the text drawn straight on the wallpaper:

- the `RETRO//OS` system badge (title, version, build date),
- the desktop icon labels (on their own dark label patch, with a
  text shadow),
- anything under the CRT scanlines, which darken every third pixel
  row.

`tests/e2e/contrast.spec.ts` measures these against the real pixels
instead: it hides the text, screenshots its box, and takes the worst
contrast of the text colour (with its opacity) against every pixel
behind it. It runs for both themes with the CRT effect on `subtle`
and `full`. Worst cases measured when the test was written:

| Text                   | Light | Dark  |
| ---------------------- | ----- | ----- |
| Badge title            | 9.5:1 | 11:1  |
| Badge version line     | 7.3:1 | 8.3:1 |
| Badge build line (70%) | 5.8:1 | 6.6:1 |
| Icon label             | 7.2:1 | 9.7:1 |

## Rules for new text

- Text on a window surface uses `--text`, or `--text-dim` only on
  `--surface-3`. `--link` passes on `--surface-3` but not on
  `--surface`; use `--text` with an underline there.
- Text on the wallpaper needs a backing (a label patch or a glow)
  and goes into `contrast.spec.ts`.
- axe measures a window while it is still fading in over the
  wallpaper unless the test waits for its animations to finish.
