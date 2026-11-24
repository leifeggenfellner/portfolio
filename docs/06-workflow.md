# 06 — Development workflow

## Local setup

```bash
pnpm install
pnpm dev          # http://localhost:4321
pnpm test         # vitest, watch with `pnpm test:watch`
pnpm e2e          # playwright (run `pnpm e2e:install` once)
pnpm run ci       # full pre-push gate
```

## Branching

- `main` — protected. Always green. Auto-deploys to GitHub Pages.
- `feat/<short-slug>` — feature branches.
- `fix/<short-slug>` — bug fixes.
- `chore/<short-slug>` — refactor / infra / docs.

Trunk-based; no long-lived release branches.

## Commits — Conventional Commits

`<type>(<scope>): <subject>`

`type` ∈ feat | fix | docs | style | refactor | perf | test |
chore | build | ci.

Examples:

- `feat(shell): add command palette`
- `fix(primitives): RetroButton ignores onPointerUp when disabled`
- `docs(arch): record adr-0003`

The commit body is for the _why_, never the _what_.

## PR standards

A PR must:

1. Pass `pnpm run ci`.
2. Be ≤ ~400 lines of diff when possible.
3. Include test coverage for new behavior (or an explicit note
   for visual-only changes).
4. Link the issue and the ADR (if architectural).

PR template lives at `.github/pull_request_template.md`.

## Review process

1. Self-review the diff before requesting review.
2. Run the **skills** relevant to the change (see `.claude/skills/`):
   - Any change → `review-pr` (tokens, mockups, motion, scope)
   - Layout → `responsive-audit`
   - New primitive → `accessibility-audit`, `generate-tests`
   - New app, dependency or 3D → `performance-audit`
3. Address skill findings in the same PR.
4. Human review focuses on: architecture fit, naming, edge
   cases, and the "is this the right thing to build" question.

## Release / versioning

The site is continuously deployed. We tag `v0.x.y` on
notable milestones (boot v1, command palette ships, etc.) for
changelog clarity. No semver contract is exposed — there's no
public package.

## CI/CD

- `.github/workflows/ci.yml` — typecheck, lint, unit, build,
  E2E. Required on every PR.
- `.github/workflows/deploy.yml` — on push to `main`, build with
  the configured `SITE_URL` + `BASE_PATH` and publish `dist/` to
  GitHub Pages.
