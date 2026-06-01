---
name: file-structure-enforcement
description: Validate folder placement and naming conventions across the repo.
---

# Skill — file structure enforcement

1. Read `docs/01-architecture.md` and `docs/08-conventions.md`.
2. List all files under `src/` and assert:
   - Components are in the correct layer folder
     (primitives/effects/apps/shell).
   - File names match: `PascalCase.tsx` for components,
     `use-kebab.ts` for hooks, `kebab.ts` for utilities.
   - No CSS files outside `src/styles/`.
   - No barrel files outside `primitives/index.ts`.
3. For each violation, propose the correct path and a
   `git mv` command.
4. After fixing, update path-alias imports if needed.
