import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import svelte from "@astrojs/svelte";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, fontProviders } from "astro/config";
import pkg from "./package.json" with { type: "json" };

// The site lives at the root of its own domain. SITE_URL and BASE_PATH
// override this, e.g. to serve from https://<user>.github.io/<repo>/
// (base "/<repo>/"). Empty values fall back to the defaults.
const SITE = process.env.SITE_URL || "https://eggenfellner.no";
const BASE = process.env.BASE_PATH || "/";
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
  // Only normal styles: nothing uses italic, and Astro would otherwise
  // include (and preload) italic files the first paint never needs.
  fonts: [
    {
      provider: fontProviders.google(),
      name: "Inter",
      cssVariable: "--font-body",
      weights: ["400", "500", "600", "700"],
      styles: ["normal"],
      fallbacks: ["Hanken Grotesk", "system-ui", "sans-serif"],
    },
    {
      provider: fontProviders.google(),
      name: "Pixelify Sans",
      cssVariable: "--font-chrome",
      weights: ["400", "600"],
      styles: ["normal"],
      fallbacks: ["Hanken Grotesk", "system-ui", "sans-serif"],
    },
    {
      provider: fontProviders.google(),
      name: "VT323",
      cssVariable: "--font-mono",
      weights: ["400"],
      styles: ["normal"],
      fallbacks: ["JetBrains Mono", "Courier New", "monospace"],
    },
  ],
  devToolbar: { enabled: true },
});
