// Hard rule 2 (AGENTS.md): no raw colours in components — add a token in
// src/styles/tokens.css first. Fails on colour literals and hand-written
// title-bar gradients in components, apps and layouts. Allowed: fallbacks
// for when a canvas can't read a token (the line says "fallback"), and the
// theme-color meta tag, which can't use CSS variables.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOTS = ["src/components", "src/apps", "src/layouts"];
const COLOUR = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch)\(/;
const TITLE_GRADIENT = /var\(--title-(?:active|inactive)-from\)/;
const ALLOWED = /fallback|theme-color/i;

function* files(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* files(path);
    else if (/\.(svelte|astro)$/.test(name)) yield path;
  }
}

const problems = [];
for (const file of ROOTS.flatMap((root) => [...files(root)])) {
  readFileSync(file, "utf8")
    .split("\n")
    .forEach((line, i) => {
      if (ALLOWED.test(line)) return;
      if (COLOUR.test(line)) problems.push(`${file}:${i + 1}: raw colour; add a token in src/styles/tokens.css`);
      if (TITLE_GRADIENT.test(line)) problems.push(`${file}:${i + 1}: title-bar gradient; use the title-bar utility`);
    });
}

if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
