# 07 — Roadmap

## v0.1 — Scaffold (this delivery)

- [x] Repo configs, TS strict, Tailwind v4 tokens
- [x] Primitives: RetroButton, RetroCard, WindowHeader, RetroWindow
- [x] Window-manager store + drag hook
- [x] Wallpaper + CRT + Boot
- [x] App registry + 6 placeholder apps
- [x] Astro entry page + 404
- [x] Architecture docs + ADRs
- [x] Claude agents + skills + Copilot chatmodes
- [x] GH Pages deploy workflow

## v0.2 — Shell completion

- [ ] Taskbar with active windows + clock + tray
- [ ] Start menu with sections + recent
- [ ] Dock (mobile-first surface)
- [ ] Command palette (⌘K / Ctrl-K) with fuzzy match
- [ ] AppErrorBoundary "blue screen" fallback
- [ ] Tweaks panel (theme/CRT/accent/boot) with `localStorage`

## v0.3 — App content

- [ ] About: real bio, MDX support
- [ ] Projects: FileExplorer-style grid + per-project ProjectWindow
- [ ] Terminal: real command parser (help, ls, cat, open, theme, crt, neofetch, sudo)
- [ ] Skills Matrix: animated bar meters from content
- [ ] Contact Terminal: type-to-fill validated form posting to
      a serverless endpoint
- [ ] Minigame: minesweeper or snake

## v0.4 — Polish + perf

- [ ] Self-host fonts; subset Pixelify Sans + VT323
- [ ] Visual regression suite
- [ ] Lighthouse CI gates
- [ ] Project case-study pages (`/projects/[slug]` static MDX)
- [ ] Sitemap + RSS for posts

## v0.5 — Extensibility

- [ ] Public app SDK: any external package can register an app
- [ ] Themes as packages
- [ ] Save/restore desktop session
- [ ] Multi-monitor / split layouts

## Scaling strategy

- The site stays static. Any future dynamic feature (guestbook,
  comments) becomes a Cloudflare Worker or GitHub Issues-backed
  microservice, not a framework migration.
- New apps are additive. The shell never changes when an app
  is added — only `apps/registry.ts` does.
- When `apps/` exceeds ~20 entries, split into route-based
  Astro pages (`/app/terminal`) sharing the same primitives.
