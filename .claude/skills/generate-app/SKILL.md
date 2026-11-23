---
name: generate-app
description: Add a new desktop app window end-to-end (component + registry entry + E2E test). Use when adding anything that opens in its own window, static or interactive.
---

# Skill — generate a new app

## Inputs

1. App id (kebab, used as window id).
2. Title (with vibe — e.g. "Resume.pdf — Reader").
3. Icon glyph.
4. Default geometry (or use 480x360 centered).

## Steps

1. Create `src/apps/<id>/`. Interactive app: `App.svelte` taking
   `AppProps` (`src/lib/app-shell.ts`), with pure logic in
   `logic.ts` (unit-test it only if it has real logic). Static,
   zero-JS app: an `.astro` component plus a
   `<template data-static-app>` for it in `src/pages/index.astro`.
   Use primitives — never raw chrome.
2. Add `src/apps/<id>/manifest.ts`; the registry
   (`src/apps/registry.ts`) picks it up, nothing else lists apps:

   ```ts
   import icon from "@/assets/icons/apps/pixel/<id>.svg?url";
   import type { AppManifest } from "@lib/app-shell";

   export default {
     kind: "svelte", id: "<id>", order: <n>, title: "<Title>", icon,
     defaults: { x, y, w, h },
     load: () => import("./App.svelte"),
   } satisfies AppManifest;
   ```

3. Add an E2E case to `tests/e2e/apps.spec.ts` (use `openApp`)
   only for a flow that could really break.
4. Verify it appears as a desktop icon and opens correctly.
5. Run `pnpm run ci`.

## Anti-patterns

- Importing another app.
- Reaching the shell from inside the app body (apps stay
  agnostic; ask the `shell` prop, or kernel services via `getOs()`).
- New colors / shadows without a token in `tokens.css`.
