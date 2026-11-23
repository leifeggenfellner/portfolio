import path from "node:path";
import { fileURLToPath } from "node:url";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vitest/config";
import { contentData } from "./src/content/vite-plugin";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [svelte(), contentData()],
  resolve: {
    conditions: ["browser"],
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@primitives": path.resolve(__dirname, "src/components/primitives"),
      "@shell": path.resolve(__dirname, "src/components/shell"),
      "@apps": path.resolve(__dirname, "src/apps"),
      "@effects": path.resolve(__dirname, "src/components/effects"),
      "@lib": path.resolve(__dirname, "src/lib"),
      "@styles": path.resolve(__dirname, "src/styles"),
      "@content": path.resolve(__dirname, "src/content"),
    },
  },
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/unit/**/*.{test,spec}.ts", "src/**/*.{test,spec}.ts"],
    exclude: ["tests/e2e/**", "node_modules", "dist", "retro-os"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/components/primitives/**", "src/lib/**", "src/apps/*/*.ts"],
      // Astro components render at build time and can't be parsed for v8 coverage.
      exclude: ["**/*.astro", "src/apps/*/manifest.ts"],
      // No thresholds: coverage points at untested risky code, it isn't a goal (docs/04-testing-strategy.md).
    },
  },
});
