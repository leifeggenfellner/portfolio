/**
 * Writes docs generated from code, so they can't drift from it. With
 * `--check`, fails instead of writing when a file is out of date (CI).
 *
 * Run with `node --experimental-strip-types` (see package.json): the
 * sources it imports are TypeScript with no imports of their own. App
 * manifests import icons through Vite, so their plain fields are read as
 * text instead.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { format, resolveConfig } from "prettier";
import { SHORTCUTS, shortcutsByPlace } from "../src/lib/os/shortcuts.ts";
import { SETTINGS_SCHEMA } from "../src/lib/settings.ts";

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

/** The literal fields of each src/apps/<id>/manifest.ts, in desktop order. */
function manifests() {
  const field = (source, name) => source.match(new RegExp(`\\n  ${name}: "([^"]*)"`))?.[1];
  return readdirSync("src/apps", { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => readFileSync(`src/apps/${entry.name}/manifest.ts`, "utf8"))
    .map((source) => ({
      id: field(source, "id"),
      title: field(source, "title"),
      route: field(source, "route"),
      order: Number(source.match(/\n {2}order: (\d+)/)?.[1]),
      subpath: source.includes("\n  subpath:"),
    }))
    .sort((a, b) => a.order - b.order);
}

function inventoryDoc() {
  const apps = manifests();
  const projects = readdirSync("src/content/projects")
    .filter((name) => name.endsWith(".json"))
    .map((name) => JSON.parse(readFileSync(`src/content/projects/${name}`, "utf8")).slug)
    .sort();
  const cell = (text) => String(text).replaceAll("|", "\\|");
  const settings = Object.entries(SETTINGS_SCHEMA).map(([key, spec]) => {
    const values = spec.kind === "toggle" ? "on, off" : spec.options.map(([value]) => value).join(", ");
    const shown = spec.kind === "toggle" ? (spec.default ? "on" : "off") : spec.default;
    return `| \`${key}\` | ${cell(spec.label)} | ${values} | ${shown} | ${spec.attribute ? `\`${spec.attribute}\`` : "—"} |`;
  });
  return [
    "# Inventory",
    "<!-- Generated from the app manifests, content and settings schema by `pnpm docs:generate`. Do not edit. -->",
    "What the site is made of, from the code that defines it.",
    `## Apps (${apps.length})\n\nOne folder each in \`src/apps/\`, in desktop order.\n\n| App | Id | Page |\n| --- | --- | --- |\n` +
      apps
        .map((a) => `| ${cell(a.title)} | \`${a.id}\` | \`${a.route}\`${a.subpath ? " (+ sub-pages)" : ""} |`)
        .join("\n"),
    `## Pages\n\nEvery page is server-rendered; app pages are the desktop with that window open.\n\n` +
      [
        "`/` — the desktop",
        ...apps.map((a) => `\`${a.route}\` — ${a.title}`),
        ...projects.map((slug) => `\`/projects/${slug}/\` — Projects, at that project`),
        "`/posts/` and each published post — documents",
        "`/rss.xml`, `/sitemap-index.xml`, `/robots.txt`",
      ]
        .map((line) => `- ${line}`)
        .join("\n"),
    `## Settings (${settings.length})\n\nFrom \`SETTINGS_SCHEMA\` in \`src/lib/settings.ts\`.\n\n| Key | Label | Values | Default | On \`<html>\` |\n| --- | --- | --- | --- | --- |\n` +
      settings.join("\n"),
    "## Shortcuts\n\nSee [keyboard.md](./keyboard.md).",
  ].join("\n\n");
}

const DOCS = { "docs/keyboard.md": keyboardDoc, "docs/inventory.md": inventoryDoc };

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
/**
 * Repo paths mentioned in the docs (`src/...`, `tests/...`, …) must exist.
 * ADRs are records of their time and keep the paths they had.
 */
/** Paths a decision has planned but nothing uses yet (ADR 0005: models arrive with the first 3D app). */
const PLANNED = ["src/assets/models/"];

function missingReferences() {
  const files = [
    "README.md",
    "AGENTS.md",
    ...readdirSync("docs")
      .filter((n) => n.endsWith(".md"))
      .map((n) => `docs/${n}`),
    ...readdirSync(".claude/skills")
      .filter((n) => n !== "three-best-practices")
      .map((n) => `.claude/skills/${n}/SKILL.md`)
      .filter((path) => existsSync(path)),
  ];
  const PATH = /(?<![\w/.-])((?:src|tests|scripts|docs|public|\.claude|\.github)\/[\w./@-]+[\w/])/g;
  const missing = [];
  for (const file of files) {
    for (const [, path] of readFileSync(file, "utf8").matchAll(PATH)) {
      if (!existsSync(path) && !PLANNED.includes(path)) missing.push(`${file}: ${path}`);
    }
  }
  return missing;
}

const missing = missingReferences();
if (missing.length) {
  console.error(`Docs reference files that don't exist:\n${missing.join("\n")}`);
  stale = true;
}
if (stale) process.exit(1);
