// Shared by the Astro build, Vitest, svelte-check and editors, so every tool
// compiles components the same way.
import { vitePreprocess } from "@astrojs/svelte";

/** @type {import("@sveltejs/vite-plugin-svelte").SvelteConfig} */
export default {
  preprocess: vitePreprocess(),
};
