import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

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
  integrations: [react(), mdx(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
  prefetch: { prefetchAll: true, defaultStrategy: "viewport" },
  build: { inlineStylesheets: "auto" },
  devToolbar: { enabled: true },
});
