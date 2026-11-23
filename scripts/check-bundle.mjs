// Reports what the home page ships and fails when it exceeds the budgets in
// docs/05-performance-a11y.md. "Initial" is everything the first paint
// needs: scripts, stylesheets and inline code in dist/index.html, the
// desktop island and its renderer, and their static imports. Dynamic
// imports (the apps) are lazy chunks, listed but not budgeted.
import { readFileSync, readdirSync, appendFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import path from "node:path";

const DIST = path.resolve(process.argv[2] ?? "dist");
const BUDGET_KB = { js: 90, css: 25 };

const gz = (text) => gzipSync(text, { level: 9 }).length;
const kb = (bytes) => (bytes / 1024).toFixed(1);
const read = (url) => readFileSync(path.join(DIST, url.replace(/^\//, "")), "utf8");

const html = read("/index.html");
const attrs = (pattern) => [...html.matchAll(pattern)].map((m) => m[1]);

const entries = [
  ...attrs(/<script[^>]*\ssrc="([^"]+\.js)"/g),
  ...attrs(/<link[^>]*rel="modulepreload"[^>]*href="([^"]+)"/g),
  ...attrs(/component-url="([^"]+)"/g),
  ...attrs(/renderer-url="([^"]+)"/g),
];

// Walk static imports only: `from"./x.js"` and `import"./x.js"`, never `import("./x.js")`.
const initial = new Set();
const queue = [...entries];
while (queue.length) {
  const url = queue.shift();
  if (initial.has(url)) continue;
  initial.add(url);
  for (const [, spec] of read(url).matchAll(/(?:\bfrom|\bimport)\s*"(\.{1,2}\/[^"]+\.js)"/g)) {
    queue.push(path.posix.join(path.posix.dirname(url), spec));
  }
}

const inlineScripts = [...html.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
const inlineStyles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]);
const stylesheets = attrs(/<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g);

const jsRows = [...initial].map((url) => [url, gz(read(url))]);
jsRows.push(["(inline scripts)", inlineScripts.reduce((sum, code) => sum + gz(code), 0)]);
const cssRows = stylesheets.map((url) => [url, gz(read(url))]);
cssRows.push(["(inline styles)", inlineStyles.reduce((sum, code) => sum + gz(code), 0)]);

const lazyRows = readdirSync(path.join(DIST, "_astro"))
  .filter((name) => name.endsWith(".js") && !initial.has(`/_astro/${name}`))
  .map((name) => [`/_astro/${name}`, gz(read(`/_astro/${name}`))])
  .sort((a, b) => b[1] - a[1]);

const total = (rows) => rows.reduce((sum, [, bytes]) => sum + bytes, 0);
const jsTotal = total(jsRows);
const cssTotal = total(cssRows);
const over = [];
if (jsTotal > BUDGET_KB.js * 1024) over.push(`JS ${kb(jsTotal)} KB > ${BUDGET_KB.js} KB`);
if (cssTotal > BUDGET_KB.css * 1024) over.push(`CSS ${kb(cssTotal)} KB > ${BUDGET_KB.css} KB`);

const table = (rows) => rows.map(([name, bytes]) => `| \`${name}\` | ${kb(bytes)} |`).join("\n");
const report = `## Bundle size (gzipped)

| Initial | Size (KB) | Budget (KB) |
| --- | --- | --- |
| JS | ${kb(jsTotal)} | ${BUDGET_KB.js} |
| CSS | ${kb(cssTotal)} | ${BUDGET_KB.css} |

<details><summary>Initial files</summary>

| File | KB |
| --- | --- |
${table([...jsRows, ...cssRows])}

</details>

<details><summary>Lazy chunks (loaded when an app opens)</summary>

| File | KB |
| --- | --- |
${table(lazyRows)}

</details>
`;

console.log(report);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, report);
if (over.length) {
  console.error(`Over budget: ${over.join("; ")}`);
  process.exit(1);
}
