// Writes the representative Lighthouse run from an LHCI filesystem upload as a
// Markdown table, to stdout and to the GitHub job summary when there is one.
import { appendFileSync, readFileSync } from "node:fs";
import path from "node:path";

const [dir = ".lighthouseci/reports", label = "Lighthouse"] = process.argv.slice(2);
const manifest = JSON.parse(readFileSync(path.join(dir, "manifest.json"), "utf8"));
const runs = manifest.filter((run) => run.isRepresentativeRun);

const rows = runs.map((run) => {
  const report = JSON.parse(readFileSync(run.jsonPath, "utf8"));
  const audit = (id) => report.audits[id].numericValue;
  return [
    new URL(run.url).pathname,
    Math.round(report.categories.performance.score * 100),
    `${Math.round(audit("largest-contentful-paint"))} ms`,
    audit("cumulative-layout-shift").toFixed(3),
    `${Math.round(audit("total-blocking-time"))} ms`,
    `${Math.round(audit("first-contentful-paint"))} ms`,
  ];
});

const report = `## ${label}

| Page | Performance | LCP | CLS | TBT | FCP |
| --- | --- | --- | --- | --- | --- |
${rows.map((row) => `| ${row.join(" | ")} |`).join("\n")}

Budgets in \`lighthouserc.mobile.json\` and \`lighthouserc.desktop.json\`.
`;

console.log(report);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, report);
