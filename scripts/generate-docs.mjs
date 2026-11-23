/**
 * Writes docs generated from code, so they can't drift from it. With
 * `--check`, fails instead of writing when a file is out of date (CI).
 *
 * Run with `node --experimental-strip-types` (see package.json): the
 * sources are TypeScript with no imports.
 */
import { readFile, writeFile } from "node:fs/promises";
import { format, resolveConfig } from "prettier";
import { SHORTCUTS, shortcutsByPlace } from "../src/lib/os/shortcuts.ts";

const check = process.argv.includes("--check");

function keyboardDoc() {
  const sections = shortcutsByPlace().map(
    ([where, shortcuts]) =>
      `## ${where}\n\n| Keys | What it does |\n| --- | --- |\n` +
      shortcuts.map((s) => `| ${s.label.replaceAll("|", "\\|")} | ${s.description} |`).join("\n"),
  );
  return [
    "# Keyboard",
    "<!-- Generated from src/lib/os/shortcuts.ts by `pnpm docs:generate`. Do not edit. -->",
    `Every shortcut on the desktop (${Object.keys(SHORTCUTS).length} in all). On a Mac, Ctrl is Cmd. The Terminal's \`man keys\` prints the same list.`,
    ...sections,
  ].join("\n\n");
}

const DOCS = { "docs/keyboard.md": keyboardDoc };

let stale = false;
for (const [path, build] of Object.entries(DOCS)) {
  const next = await format(build(), { ...(await resolveConfig(path)), filepath: path });
  const current = await readFile(path, "utf8").catch(() => "");
  if (current === next) continue;
  if (check) {
    console.error(`${path} is out of date; run pnpm docs:generate`);
    stale = true;
  } else {
    await writeFile(path, next);
    console.log(`wrote ${path}`);
  }
}
if (stale) process.exit(1);
