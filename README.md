# Retro — a portfolio OS

> A retro-OS-inspired portfolio site built as a working desktop
> environment. Vaporwave chrome, CRT scanlines, draggable
> windows, a real terminal. Engineered like production.

![status](https://img.shields.io/badge/status-scaffold-magenta) ![framework](https://img.shields.io/badge/Astro-5-cyan) ![tailwind](https://img.shields.io/badge/Tailwind-v4-cyan) ![tests](https://img.shields.io/badge/Vitest%20%2B%20Playwright-passing-green)

## What this is

The home route IS the hero: a faux operating system you can
interact with. Open the Terminal, drag windows, play
Minesweeper. Underneath: TypeScript, strict layering, design
tokens, and a small primitive kit.

## Stack

- **Astro 6** with the Svelte integration (one Svelte 5 island
  for the Desktop; static apps render as Astro components)
- **TypeScript** (strict, no `any`)
- **TailwindCSS v4** with CSS-first `@theme` tokens
- **Svelte stores** for the window manager and settings
- **Vitest + Testing Library** for unit/component
- **Playwright + axe** for E2E and a11y
- **pnpm** as the package manager
- Deploy: **GitHub Pages** (static)

See [`docs/00-framework-decision.md`](./docs/00-framework-decision.md)
for the framework rationale.

## Quick start

```bash
pnpm install
pnpm dev
# open http://localhost:4321 — press Esc to skip the boot
```

## Scripts

| Command          | What it does                                 |
| ---------------- | -------------------------------------------- |
| `pnpm dev`       | Astro dev server                             |
| `pnpm build`     | Production static build (`dist/`)            |
| `pnpm preview`   | Serve the production build                   |
| `pnpm test`      | Vitest unit + component                      |
| `pnpm test:cov`  | + coverage report                            |
| `pnpm e2e`       | Playwright E2E (run `pnpm e2e:install` once) |
| `pnpm typecheck` | `astro check` + `tsc --noEmit`               |
| `pnpm lint`      | ESLint flat config                           |
| `pnpm run ci`    | typecheck + lint + test + build (the gate)   |

## Repo map

```
docs/             architecture, design system, ADRs
retro-os/         design source-of-truth mockups (not shipped)
src/
  pages/          Astro routes
  layouts/        RootLayout.astro
  styles/         tokens.css → theme, chrome, effects, cursors (globals.css)
  lib/            pure logic; lib/os/ is the kernel (window manager, keymap, …)
  apps/<id>/      one folder per app: manifest, App.svelte, logic
  components/
    primitives/   RetroWindow, WindowHeader, RetroButton, ContextMenu, Icon, …
    effects/      Wallpaper, OutrunScene, CrtLayer, BootSequence, Screensaver
    shell/        Os (island root), Desktop, WindowLayer, Taskbar, StartMenu, …
  content/        profile, skills, projects (JSON) + posts (MDX), schemas
tests/
  unit/           Vitest
  e2e/            Playwright (+ axe)
.claude/          AI skills (Claude Code)
.github/
  workflows/      ci.yml + GitHub Pages deploy
```

## Documentation

Start at [`docs/README.md`](./docs/README.md). Highlights:

- [00 — Astro vs Remix](./docs/00-framework-decision.md)
- [01 — Architecture & folder layering](./docs/01-architecture.md)
- [02 — Design system](./docs/02-design-system.md)
- [03 — Tailwind v4 tokens](./docs/03-tailwind-tokens.md)
- [04 — Testing strategy](./docs/04-testing-strategy.md)
- [05 — Performance + accessibility](./docs/05-performance-a11y.md)
- [06 — Development workflow](./docs/06-workflow.md)
- [Inventory](./docs/inventory.md) and [keyboard](./docs/keyboard.md) — generated from code
- Roadmap: the [issues](https://github.com/leifeggenfellner/portfolio/issues)
- [08 — Conventions](./docs/08-conventions.md)

## AI skills

Skills (reusable playbooks for Claude Code) live in [`.claude/skills/`](./.claude/skills/):
`review-pr`, `generate-app`, `generate-primitive`, `generate-tests`,
`accessibility-audit`, `responsive-audit`, `performance-audit`,
`three-asset-pipeline`, `three-best-practices` (vendored).

## Deployment

GitHub Pages, auto-deployed from `main` via
[`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml).

Two repo variables drive the static build:

| Var         | Project page (default)   | User/Org page (`user.github.io`) |
| ----------- | ------------------------ | -------------------------------- |
| `SITE_URL`  | `https://user.github.io` | `https://user.github.io`         |
| `BASE_PATH` | `/<repo>/`               | `/`                              |

## License

MIT — see [`LICENSE`](./LICENSE).
