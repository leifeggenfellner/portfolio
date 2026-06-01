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
│   │   ├── store/              # zustand stores (window-manager)
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
├── .claude/                    # Claude Code: agents + skills
└── .github/
    ├── chatmodes/              # Copilot chat modes (mirrors of Claude agents)
    └── workflows/              # ci.yml, deploy.yml (GH Pages)
```

## State management

- **Zustand** for window-manager state (one store, ~80 lines).
- **React local state** for everything else.
- **No global event bus**, no Redux, no context for things one or
  two components need. If a piece of state lives in only one app,
  it lives in that app.

## Hydration strategy

| Surface               | Strategy         | Why                            |
| --------------------- | ---------------- | ------------------------------ |
| `index.astro`         | `client:load`    | The desktop IS the hero        |
| Future `posts/[slug]` | static           | MDX content, no JS needed      |
| Future `projects/...` | `client:visible` | Reveal animation when scrolled |

The Desktop owns one zustand store and renders apps via
`React.lazy` — so opening the Terminal does not download
Minesweeper.

## Error boundaries

- Each app is wrapped at the shell level in an `<AppErrorBoundary />`
  that renders a "blue screen" style fallback inside the window
  chrome. One crashing app never takes down the desktop.
- See `src/components/shell/AppErrorBoundary.tsx` (to be authored).
