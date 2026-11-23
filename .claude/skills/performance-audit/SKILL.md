---
name: performance-audit
description: Check bundle size, hydration and animation cost against the budgets. Run for a new app, a new dependency, a 3D scene, or a large diff.
---

# Skill — performance audit

## When to invoke

- A new interactive app, island or `client:*` directive.
- A new runtime dependency (with its ADR).
- Anything importing `three` / `@threlte/*`.
- Before a release, or when a diff is large.

## Steps

1. Read the budgets in `docs/05-performance-a11y.md`.
2. `pnpm build`, then measure what `/` ships gzipped:
   ```sh
   find dist -name '*.js' -o -name '*.css' | xargs gzip -c | wc -c
   ```
   Compare against `origin/main` built the same way and report
   the delta per file.
3. Check hydration:
   - No new `client:load` outside the desktop island.
   - Heavy code (3D, editors, large data) is reached only through
     a registry `load()` or another dynamic `import()`, so it lands
     in its own chunk. Confirm by grepping the initial chunks for
     the package name.
   - No new third-party scripts.
4. Check motion on hot paths: only `transform` / `opacity`
   animated; no JS loop where CSS will do; continuous WebGL
   scenes use on-demand rendering.
5. If an image is the LCP element, it is eager and preloaded.

## Acceptance

- `/` within budget, or the overage is justified in the PR.
- A "perf delta" line in the PR description when bundle size
  changed.

## Failure conditions

- Budget exceeded by more than 10% without justification:
  block until fixed or justified.
