---
name: generate-tests
description: Add missing Vitest and Playwright tests for files changed on the current branch, following this repo's test layout.
---

# Skill — generate tests

1. Compute changed files: `git diff --name-only origin/main...HEAD`.
2. For each `*.svelte` in `primitives/`: ensure a
   `tests/unit/primitives/<Name>.test.ts` exists with:
   - render, keyboard, ARIA, disabled path.
3. For each `*.ts` in `lib/`: ensure a co-located or
   `tests/unit/lib/<name>.test.ts` covers every exported function.
4. For each new app: add an E2E open/close case.
5. Use `userEvent` over `fireEvent`. Prefer `getByRole`, in E2E too.
   Test the contract, not the implementation.
6. Keep tests deterministic: fake timers for animations (never a real
   sleep), no `Math.random`. No snapshot tests for visual output; use
   Playwright screenshots.
7. Run `pnpm test:cov` and report coverage delta.
