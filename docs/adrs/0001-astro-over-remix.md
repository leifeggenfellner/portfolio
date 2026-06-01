# ADR 0001 — Choose Astro over Remix

- **Status:** Accepted (2026-05-29)
- **Deciders:** Leif
- **Context:** Retro is a static portfolio with one dense
  interactive surface (the desktop hero).

## Decision

Use **Astro 5 with the React integration** for islands.
Deploy as a fully static site to GitHub Pages.

## Forces

- Most routes are static (about, posts, project cases).
- Only the home / desktop needs heavy JS (window manager,
  terminal, command palette).
- Deploy target is GitHub Pages → must produce a static
  `dist/`.
- SEO and first-paint matter — no public auth or per-visitor
  data.

## Alternatives considered

1. **Remix** — full React runtime everywhere, requires a
   server or a static adapter, far more JS shipped for the
   non-desktop routes. Rejected.
2. **Vite + React SPA** — simplest, but loses Astro's content
   collections, SEO defaults, and partial hydration. Rejected
   for maintainability.
3. **Next.js (export)** — works, but heavier defaults and more
   conventions than we benefit from. Rejected.

## Consequences

- - Near-zero JS on non-desktop routes.
- - Free MDX content pipeline.
- - Simple GH Pages deploy.
- − One large island for the desktop; we accept that cost
  intentionally.
- − Cross-island shared state requires explicit lifting; we
  avoid it by keeping the desktop a single island.
