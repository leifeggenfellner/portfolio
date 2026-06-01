# ADR 0002 — Tailwind v4 with CSS-first `@theme` tokens

- **Status:** Accepted (2026-05-29)

## Decision

All design tokens live in `src/styles/tokens.css` as CSS
custom properties. `src/styles/globals.css` imports Tailwind v4
and re-exports those variables through `@theme inline { … }`,
making the entire utility surface theme-reactive at runtime.

## Why

- Theme/CRT/accent switching is a runtime concern (data
  attributes on `<html>`). `@theme inline` keeps utilities
  referencing `var(--token)` so toggles cost zero rebuild.
- Single naming convention across CSS, JSX, and Tailwind.
- Plays well with `prefers-color-scheme` and reduced motion.

## Consequences

- Adding a token = two-line change (token + theme alias).
- No JIT codegen rebuild needed on theme toggles.
- Lint rule: no raw color literals outside `tokens.css`.
