import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import svelte from "@astrojs/svelte";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, fontProviders } from "astro/config";
import pkg from "./package.json" with { type: "json" };

// Update both values when deploying. For a user/organization GitHub Pages site
// (https://<user>.github.io) use site only and leave base = "/".
// For a project page (https://<user>.github.io/<repo>) set base to "/<repo>/".
const SITE = process.env.SITE_URL ?? "https://example.github.io";
const BASE = process.env.BASE_PATH ?? "/";
// Shown on the desktop badge and the BIOS screen; see src/lib/build-info.ts.
const BUILD_DATE = new Date().toISOString().slice(0, 10).replaceAll("-", ".");

export default defineConfig({
  site: SITE,
  base: BASE,
  output: "static",
  trailingSlash: "ignore",
  // Astro only collects CSS for components rendered during SSR, so scoped
  // <style> blocks in components that first appear after hydration (menus,
  // windows) were dropped from builds. Injecting component CSS via JS ships
  // it with whichever side renders the component.
  integrations: [svelte({ emitCss: false }), mdx(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
      __BUILD_DATE__: JSON.stringify(BUILD_DATE),
    },
  },
  prefetch: { prefetchAll: true, defaultStrategy: "viewport" },
  build: { inlineStylesheets: "auto" },
  compressHTML: true,
  fonts: [
    {
      provider: fontProviders.google(),
      name: "Inter",
      cssVariable: "--font-body",
      weights: ["400", "500", "600", "700"],
      fallbacks: ["Hanken Grotesk", "system-ui", "sans-serif"],
    },
    {
      provider: fontProviders.google(),
      name: "Pixelify Sans",
      cssVariable: "--font-chrome",
      weights: ["400", "600"],
      fallbacks: ["Hanken Grotesk", "system-ui", "sans-serif"],
    },
    {
      provider: fontProviders.google(),
      name: "VT323",
      cssVariable: "--font-mono",
      weights: ["400"],
      fallbacks: ["JetBrains Mono", "Courier New", "monospace"],
    },
  ],
  devToolbar: { enabled: true },
});
