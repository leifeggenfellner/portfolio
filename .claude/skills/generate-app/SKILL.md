---
name: generate-app
description: Scaffold a new desktop "app" window end-to-end (component + registry entry + tests).
---

# Skill — generate a new app

## Inputs

1. App id (kebab, used as window id).
2. Title (with vibe — e.g. "Resume.pdf — Reader").
3. Icon glyph.
4. Default geometry (or use 480x360 centered).

## Steps

1. Interactive app: create `src/components/apps/<PascalName>.svelte`
   taking `AppProps` (`src/lib/app-shell.ts`). Static, zero-JS app:
   create `<PascalName>.astro` and add a `<template data-static-app>`
   for it in `src/pages/index.astro`. Use primitives — never raw chrome.
2. Add an entry in `src/components/apps/registry.svelte.ts`:
   ```ts
   {
     kind: "svelte", id, title, icon,
     defaults: { x, y, w, h },
     load: () => import("@apps/<PascalName>.svelte"),
   }
   ```
3. Add an E2E case to `tests/e2e/apps.spec.ts` (use `openApp`).
4. Verify it appears as a desktop icon and opens correctly.
5. Run `pnpm run ci`.

## Anti-patterns

- Importing another app.
- Direct access to the window-manager from inside the app body
  (apps stay agnostic; ask the `shell` prop instead).
- New colors / shadows without a token in `tokens.css`.
