---
name: refactor
description: Plan and execute a safe refactor.
---

# Skill — refactor

1. Define the contract: what behavior must stay identical?
2. Write or verify tests covering that contract first.
3. Do the refactor in commits ≤ 200 lines each:
   - 1: introduce new structure parallel to old.
   - 2: migrate call sites.
   - 3: delete old.
4. Run `pnpm ci` after each commit.
5. If the refactor touches a public surface (`primitives/`,
   `lib/`), update docs and `CHANGELOG.md`.
6. If unsure, write an ADR first.
