# AGENTS.md

> Conventions for AI coding agents working in this repo.
> This file is read automatically by Claude Code and similar
> tools; humans should read it too.

## Project shape

- **Stack:** Astro 6 + Svelte 5 (runes) + TypeScript (strict) +
  Tailwind v4. Static export to GitHub Pages.
- **Architecture:** route-first (every app is a server-rendered
  URL) with an OS kernel of rune classes in context
  (`src/lib/os/`); apps are folders in `src/apps/`. See
  `docs/01-architecture.md` and ADR 0006.
- **Identity:** vaporwave retro-OS. Magenta/cyan title bars,
  chunky bevels, CRT scanlines, ~4s cinematic boot.
- **Single source of design truth:** `retro-os/` mockups.
- **Single source of engineering truth:** `docs/`.

## Hard rules

1. **Never** add a runtime dependency without an ADR in
   `docs/adrs/`.
2. **Never** introduce raw colors / shadows in components.
   Add a token in `src/styles/tokens.css` first.
3. **Never** allow upward imports (lib → components,
   primitive → app, etc.). See `docs/01-architecture.md`.
4. **Never** ship motion that ignores
   `prefers-reduced-motion`.
5. **Never** ship interactive UI without keyboard reachability
   and a visible focus ring.
6. **Never** use `any`, `as unknown as`, or `@ts-ignore`
   without a one-line justification comment.

## Tests

Lean: a test for real logic or a real failure mode, and for the flows
that would break the site; never for wiring, markup, styling or copy.
No coverage targets. See `docs/04-testing-strategy.md`.

## Default workflow for any change

1. Pick the skills that match the change (catalog below).
2. Follow their steps and checklists.
3. For non-trivial changes, run `review-pr` and
   `accessibility-audit` before merge.
4. Run `pnpm run ci`. It must be green.

## Skills catalog

`review-pr`, `generate-app`, `generate-primitive`,
`generate-tests`, `accessibility-audit`, `responsive-audit`,
`performance-audit`, `three-asset-pipeline`, `three-best-practices` (vendored).

See [`.claude/skills/`](./.claude/skills/) for full text.

## Output style for agents

- Diffs first, prose second.
- One-line summary of intent at the top of every commit body.
- When unsure about layering or naming, **stop and ask**
  rather than guessing.
- No emoji in code. Limited emoji in PR descriptions.
- No marketing language in code comments — explain _why_, not
  _what_.
