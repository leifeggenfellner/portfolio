# 01 — System architecture

## Layers (strict dependency direction, top depends on bottom)

```
┌─────────────────────────────────────────────────────────┐
│ pages/         Astro routes (thin, mostly markup)       │
├─────────────────────────────────────────────────────────┤
│ shell/         Desktop, Taskbar, StartMenu, Dock,       │
│                CommandPalette  — wires apps + manager   │
├─────────────────────────────────────────────────────────┤
│ apps/          About, ProjectsExplorer, Terminal,       │
│                SkillsMatrix, ContactTerminal, MiniGame  │
├─────────────────────────────────────────────────────────┤
│ effects/       Wallpaper, CrtLayer, BootSequence        │
├─────────────────────────────────────────────────────────┤
│ primitives/    RetroButton, RetroCard, RetroWindow,     │
│                WindowHeader, GroupBox, Tabs, Tooltip,   │
│                ContextMenu, Modal, ProgressBar          │
├─────────────────────────────────────────────────────────┤
│ lib/           cx, hooks, store (window-manager), a11y  │
├─────────────────────────────────────────────────────────┤
│ styles/        tokens.css → globals.css (@theme) →      │
│                effects.css                              │
└─────────────────────────────────────────────────────────┘
```

**Rule:** a layer never imports from itself's siblings if it can
avoid it, and never imports upward. Apps don't know about other
apps. Primitives don't know about apps. Tokens don't know about
anything.

## Folder structure

```
.
├── astro.config.ts
├── tsconfig.json
├── vitest.config.ts
├── playwright.config.ts
├── eslint.config.js
├── package.json
├── docs/                       # this folder
├── retro-os/                   # design source-of-truth mockups
├── public/                     # static assets shipped as-is
├── src/
│   ├── pages/                  # Astro routes
│   ├── layouts/                # Astro layouts (only RootLayout for now)
│   ├── content/                # content collections (TS + MDX)
│   ├── styles/                 # tokens.css, globals.css, effects.css
│   ├── lib/
│   │   ├── cx.ts
│   │   ├── hooks/              # use-drag, use-media-query, use-prefers-reduced-motion
│   │   ├── store/              # Svelte stores (window-manager, settings)
│   │   └── a11y/               # focus traps, roving tabindex, etc.
│   └── components/
│       ├── primitives/         # design-system layer
│       ├── effects/            # CRT, Wallpaper, BootSequence
│       ├── apps/               # composed portfolio apps + registry.ts
│       └── shell/              # Desktop + taskbar + start menu + dock + palette
├── tests/
│   ├── setup.ts
│   ├── unit/                   # Vitest
│   └── e2e/                    # Playwright
├── .claude/                    # Claude Code skills
└── .github/
    └── workflows/              # ci.yml, deploy.yml (GH Pages)
```

## State management

- **Svelte stores** for window-manager and settings state.
- **Svelte 5 runes** (`$state`, `$derived`) for everything else.
- **No global event bus**, no Redux, no context for things one or
  two components need. If a piece of state lives in only one app,
  it lives in that app.

## Hydration strategy

| Surface               | Strategy         | Why                            |
| --------------------- | ---------------- | ------------------------------ |
| `index.astro`         | `client:load`    | The desktop IS the hero        |
| Future `posts/[slug]` | static           | MDX content, no JS needed      |
| Future `projects/...` | `client:visible` | Reveal animation when scrolled |

The kernel's `Launcher` (`src/lib/os/launcher.svelte.ts`)
dynamic-imports each Svelte app on first open (see each
`src/apps/<id>/manifest.ts`), so opening the Terminal does not
download Minesweeper. Apps receive an `AppShell` prop
(`src/lib/app-shell.ts`) to open other apps or close their own
window; they never import the shell layer.

## Error boundaries

- Every window's content sits in its own `<svelte:boundary>`
  (`shell/AppFrame.svelte`). An error while an app renders or runs an
  effect swaps the app for a blue screen (`shell/AppCrash.svelte`)
  inside the same window chrome, with "Restart app" (recreates the
  app) and "Close". Other windows, the taskbar and the Start menu
  keep working.
- Errors in event handlers and async callbacks are not caught by
  boundaries (a Svelte rule), so apps keep those paths simple.
- A failed app import is caught and logged by the Desktop; the
  window doesn't open.
- The Terminal's hidden `panic` command crashes it on purpose; the
  e2e suite uses it to exercise the boundary.
