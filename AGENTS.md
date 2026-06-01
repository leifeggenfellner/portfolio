# AGENTS.md

> Conventions for AI coding agents working in this repo.
> This file is read automatically by Claude Code and similar
> tools; humans should read it too.

## Project shape

- **Stack:** Astro 5 + React 19 + TypeScript (strict) +
  Tailwind v4 + Zustand. Static export to GitHub Pages.
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

## Default workflow for any change

1. Identify the right agent (`.claude/agents/`).
2. Apply that agent's checklist.
3. For non-trivial changes, run `frontend-reviewer` and
   `accessibility-reviewer` before merge.
4. Run `pnpm ci`. It must be green.

## Agents catalog

| Agent                      | When to invoke                        |
| -------------------------- | ------------------------------------- |
| `ui-architect`             | Anything crossing layer boundaries    |
| `retro-os-designer`        | Anything visible changing visuals     |
| `animation-engineer`       | Keyframes, transitions, motion        |
| `accessibility-reviewer`   | Every UI PR before merge              |
| `test-engineer`            | New behavior, new lib export, bug fix |
| `frontend-reviewer`        | Every PR, final pass                  |
| `performance-auditor`      | New island, new dep, large diff       |
| `tailwind-theme-architect` | Tokens + themes + accents             |
| `interaction-designer`     | New interactive surface, new shortcut |
| `dx-infra`                 | Configs, CI, deploy, scripts          |

## Skills catalog

`generate-primitive`, `generate-app`, `review-pr`,
`enforce-architecture`, `generate-tests`,
`accessibility-audit`, `animation-review`,
`responsive-audit`, `tailwind-token-usage`, `refactor`,
`file-structure-enforcement`, `design-system-compliance`.

See [`.claude/skills/`](./.claude/skills/) for full text.

## Output style for agents

- Diffs first, prose second.
- One-line summary of intent at the top of every commit body.
- When unsure about layering or naming, **stop and ask**
  rather than guessing.
- No emoji in code. Limited emoji in PR descriptions.
- No marketing language in code comments — explain _why_, not
  _what_.
