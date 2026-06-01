# Retro — a portfolio OS

> A retro-OS-inspired portfolio site built as a working desktop
> environment. Vaporwave chrome, CRT scanlines, draggable
> windows, a real terminal. Engineered like production.

![status](https://img.shields.io/badge/status-scaffold-magenta) ![framework](https://img.shields.io/badge/Astro-5-cyan) ![tailwind](https://img.shields.io/badge/Tailwind-v4-cyan) ![tests](https://img.shields.io/badge/Vitest%20%2B%20Playwright-passing-green)

## What this is

The home route IS the hero: a faux operating system you can
interact with. Open the Terminal, drag windows, peek at the
Tweaks panel. Underneath: TypeScript, strict layering, design
tokens, and a small primitive kit.

## Stack

- **Astro 5** with the React integration (one island for the
  Desktop; everything else stays static)
- **TypeScript** (strict, no `any`)
- **TailwindCSS v4** with CSS-first `@theme` tokens
- **Zustand** for the window manager
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
| `pnpm ci`        | typecheck + lint + test + build (the gate)   |

## Repo map

```
docs/             architecture, design system, ADRs
retro-os/         design source-of-truth mockups (not shipped)
src/
  pages/          Astro routes
  layouts/        RootLayout.astro
  styles/         tokens.css → globals.css (@theme) → effects.css
  lib/            cx, hooks, zustand store, a11y helpers
  components/
    primitives/   RetroButton, RetroCard, RetroWindow, WindowHeader, …
    effects/      Wallpaper, CrtLayer, BootSequence
    apps/         About, ProjectsExplorer, Terminal, SkillsMatrix, …
    shell/        Desktop, Taskbar, StartMenu, Dock, CommandPalette
  content/        projects (TS data) + posts (MDX)
tests/
  unit/           Vitest
  e2e/            Playwright (+ axe)
.claude/          AI agents + skills (Claude Code)
.github/
  chatmodes/      Copilot mirrors of the Claude agents
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
- [07 — Roadmap](./docs/07-roadmap.md)
- [08 — Conventions](./docs/08-conventions.md)

## AI agents

This repo ships **specialist agents** and **reusable skills**
for AI-assisted development. They are defined twice so the team
can use either Claude Code or GitHub Copilot:

| Agent                      | Use it for                     |
| -------------------------- | ------------------------------ |
| `ui-architect`             | Layering, state, type safety   |
| `retro-os-designer`        | Visual fidelity to the mockups |
| `animation-engineer`       | Motion, boot, CRT              |
| `accessibility-reviewer`   | Keyboard, ARIA, contrast       |
| `test-engineer`            | Vitest + Playwright            |
| `frontend-reviewer`        | Final PR pass                  |
| `performance-auditor`      | Bundle, hydration, Vitals      |
| `tailwind-theme-architect` | Tokens + themes                |
| `interaction-designer`     | Microstates, shortcuts         |
| `dx-infra`                 | Configs, CI, deploy            |

Skills (reusable playbooks) live in [`.claude/skills/`](./.claude/skills/):
`generate-primitive`, `generate-app`, `review-pr`,
`enforce-architecture`, `generate-tests`, `accessibility-audit`,
`animation-review`, `responsive-audit`, `tailwind-token-usage`,
`refactor`, `file-structure-enforcement`, `design-system-compliance`.

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
