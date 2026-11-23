/**
 * Knip — finds unused files, exports and dependencies. Runs in CI
 * (`pnpm knip`), so dead code doesn't pile up.
 */
export default {
  $schema: "https://unpkg.com/knip@5/schema.json",
  entry: [
    "src/pages/**/*.{astro,ts}",
    // Loaded by path or glob, not by import.
    "src/directives/*.ts",
    "src/apps/*/manifest.ts",
    "src/apps/*/App.svelte",
    "scripts/*.mjs",
    "tests/**/*.{test,spec}.ts",
  ],
  project: ["src/**/*.{ts,svelte,astro}", "scripts/**/*.mjs"],
  // Types and constants exported for a module's own signatures count as used.
  ignoreExportsUsedInFile: true,
  ignoreDependencies: [
    // Read by scripts/build-icons.mjs through a require() built from the icon name.
    "@iconify-json/lucide",
    "@iconify-json/pixelarticons",
    // Imported from CSS (src/styles/globals.css), which knip doesn't read.
    "tailwindcss",
  ],
};
