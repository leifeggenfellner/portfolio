---
name: generate-tests
description: Add missing tests for changed files in the current branch.
---

# Skill — generate tests

1. Compute changed files: `git diff --name-only origin/main...HEAD`.
2. For each `*.tsx` in `primitives/`: ensure a
   `tests/unit/primitives/<Name>.test.tsx` exists with:
   - render, keyboard, ARIA, disabled path.
3. For each `*.ts` in `lib/`: ensure a co-located or
   `tests/unit/lib/<name>.test.ts` covers every exported function.
4. For each new app: add an E2E open/close case.
5. Use `userEvent` over `fireEvent`. Prefer `getByRole`.
6. Run `pnpm test:cov` and report coverage delta.
