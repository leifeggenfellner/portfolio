// eslint-disable-next-line @typescript-eslint/triple-slash-reference -- required by Astro
/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

/** Injected by astro.config.ts at build time. */
declare const __APP_VERSION__: string;
declare const __BUILD_DATE__: string;

/** Set by src/apps/preload.ts, awaited by the client:desktop directive. */
declare var __desktopReady: Promise<void> | undefined;
