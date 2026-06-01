import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import svelte from "@astrojs/svelte";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, fontProviders } from "astro/config";

// Update both values when deploying. For a user/organization GitHub Pages site
// (https://<user>.github.io) use site only and leave base = "/".
// For a project page (https://<user>.github.io/<repo>) set base to "/<repo>/".
const SITE = process.env.SITE_URL ?? "https://example.github.io";
const BASE = process.env.BASE_PATH ?? "/";

export default defineConfig({
  site: SITE,
  base: BASE,
  output: "static",
  trailingSlash: "ignore",
  integrations: [svelte(), mdx(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
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
