import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import svelte from "@astrojs/svelte";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, fontProviders } from "astro/config";
import pkg from "./package.json" with { type: "json" };
import { contentData } from "./src/content/vite-plugin";
import { SETTINGS_BOOTSTRAP_SCRIPT } from "./src/lib/settings";

// The site lives at the root of its own domain. SITE_URL and BASE_PATH
// override this, e.g. to serve from https://<user>.github.io/<repo>/
// (base "/<repo>/"). Empty values fall back to the defaults.
const SITE = process.env.SITE_URL || "https://eggenfellner.no";
const BASE = process.env.BASE_PATH || "/";
// Shown on the desktop badge and the BIOS screen; see src/lib/build-info.ts.
const BUILD_DATE = new Date().toISOString().slice(0, 10).replaceAll("-", ".");

// The one inline script we write by hand (RootLayout); Astro hashes its own.
const BOOTSTRAP_HASH: `sha256-${string}` = `sha256-${createHash("sha256").update(SETTINGS_BOOTSTRAP_SCRIPT).digest("base64")}`;

export default defineConfig({
  site: SITE,
  base: BASE,
  output: "static",
  // A strict Content Security Policy in a <meta> tag (GitHub Pages can't set
  // headers): Astro hashes its scripts and styles; nothing loads from another
  // origin. Inline styles stay allowed: server-rendered windows are
  // positioned with style attributes before hydration.
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self'",
        "worker-src 'self'",
        "manifest-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ],
      scriptDirective: { hashes: [BOOTSTRAP_HASH] },
      // Astro 6 can't scope a source to style attributes only (that's 7.1),
      // so styles allow inline; scripts stay hash-only.
      styleDirective: { resources: ["'self'", "'unsafe-inline'"] },
    },
  },
  trailingSlash: "ignore",
  integrations: [
    svelte(),
    mdx(),
    sitemap(),
    {
      // Astro 6 hashes inline styles into style-src even next to 'unsafe-inline',
      // and any hash makes browsers ignore 'unsafe-inline', which the
      // server-rendered style attributes need. Scripts keep their hashes.
      name: "csp-inline-styles",
      hooks: {
        "astro:build:done": async ({ dir }) => {
          const files = (await readdir(dir, { recursive: true })).filter((f) => f.endsWith(".html"));
          for (const file of files) {
            const path = new URL(file, dir);
            const html = await readFile(path, "utf8");
            const next = html.replace(/style-src [^;"]*/, (directive) =>
              directive.replace(/ 'sha(256|384|512)-[^']+'/g, ""),
            );
            if (next !== html) await writeFile(path, next);
          }
        },
      },
    },
    {
      // client:desktop — hydrate once an app route's app has loaded (src/directives/desktop.ts).
      name: "desktop-directive",
      hooks: {
        "astro:config:setup": ({ addClientDirective }) =>
          addClientDirective({ name: "desktop", entrypoint: "./src/directives/desktop.ts" }),
      },
    },
  ],
  vite: {
    plugins: [tailwindcss(), contentData()],
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
