/**
 * ASCII pixel art to SVG. Each row is a string, one character per pixel, and
 * "." is transparent. Horizontal runs merge into one rectangle, so a sprite
 * costs one path per colour rather than one element per pixel.
 */
export function pixelPaths(rows: readonly string[]): Map<string, string> {
  const paths = new Map<string, string>();
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const char = row.charAt(x);
      let end = x + 1;
      while (row.charAt(end) === char) end += 1;
      if (char !== "." && char !== " ") {
        paths.set(char, `${paths.get(char) ?? ""}M${x} ${y}h${end - x}v1h${x - end}z`);
      }
      x = end;
    }
  });
  return paths;
}
