/**
 * Version and build date, injected by astro.config.ts. Unit tests run without
 * Astro's Vite config, so both fall back to placeholders there.
 */
export const APP_VERSION: string = typeof __APP_VERSION__ === "string" ? __APP_VERSION__ : "0.0.0";
export const BUILD_DATE: string = typeof __BUILD_DATE__ === "string" ? __BUILD_DATE__ : "0000.00.00";
