/**
 * Knip — finds unused files, exports, dependencies, and types.
 * Run periodically (or on demand) to keep the surface lean.
 */
export default {
  $schema: "https://unpkg.com/knip@5/schema.json",
  entry: [
    "src/pages/**/*.{astro,ts,tsx}",
    "src/content/config.ts",
    "astro.config.ts",
    "vitest.config.ts",
    "playwright.config.ts",
    "eslint.config.js",
    "stylelint.config.mjs",
    "knip.config.ts",
    "tests/**/*.{test,spec}.{ts,tsx}",
  ],
  project: ["src/**/*.{ts,tsx,astro}"],
  ignore: ["retro-os/**", "dist/**", ".astro/**"],
  ignoreDependencies: [
    // Loaded by Astro/Tailwind/Vite plugins, not directly imported
    "prettier-plugin-astro",
    "prettier-plugin-tailwindcss",
  ],
  ignoreBinaries: ["astro"],
};
