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

1. Create `src/components/apps/<PascalName>.tsx`. Default export
   a React component. Use primitives — never raw chrome.
2. Add an entry in `src/components/apps/registry.ts`:
   ```ts
   {
     id, title, icon,
     defaults: { x, y, w, h },
     render: lazy(() => import("./<PascalName>")),
   }
   ```
3. Add an E2E case to `tests/e2e/desktop.spec.ts` opening the app.
4. Verify it appears as a desktop icon and opens correctly.
5. Run `pnpm ci`.

## Anti-patterns

- Importing another app.
- Direct access to the window-manager from inside the app body
  (apps stay agnostic).
- New colors / shadows without going through the theme architect.
