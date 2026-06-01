---
name: generate-primitive
description: Scaffold a new primitive component end-to-end (component + JSDoc + tests + barrel export).
---

# Skill — generate a new primitive

When the user asks for a new primitive (e.g. `Tooltip`,
`ProgressBar`), follow this exactly.

## Inputs to confirm

1. Component name (PascalCase).
2. Variants and sizes, if any.
3. A11y role / pattern (button? dialog? tablist?).
4. One sentence of intent.

## Steps

1. Read `docs/02-design-system.md` §"Extraction rules" and
   `docs/08-conventions.md`.
2. Create `src/components/primitives/<Name>.tsx`:
   - Top-of-file JSDoc: purpose, composition, a11y note.
   - Strict prop interface (export it as `<Name>Props`).
   - Use Tailwind utilities + bevel classes; never raw colors.
   - Default-export NONE — named export only.
3. Add an export to `src/components/primitives/index.ts`.
4. Create `tests/unit/primitives/<Name>.test.tsx` with:
   - default render
   - keyboard interaction (Tab, Enter/Space, arrows where relevant)
   - ARIA attribute assertions
   - disabled / variant paths
5. Run `pnpm test --run` and `pnpm typecheck`.
6. If the component introduces motion → invoke `animation-engineer`.
7. If the component introduces a new color/shadow → invoke
   `tailwind-theme-architect` to add the token first.

## Acceptance

- Lint, typecheck, unit tests all green.
- Exported from `primitives/index.ts`.
- A11y role correct; focus visible via `.focus-ring`.
