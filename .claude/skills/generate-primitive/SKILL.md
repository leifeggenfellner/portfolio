---
name: generate-primitive
description: Scaffold a new primitive in src/components/primitives (component + tests + barrel export). Use when adding a reusable chrome piece like a button, menu or window part.
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
2. Create `src/components/primitives/<Name>.svelte`:
   - A short comment on purpose, composition and the a11y contract.
   - Strict `Props` interface read with `$props()`.
   - Use Tailwind utilities + bevel classes; never raw colors.
3. Add an export to `src/components/primitives/index.ts`.
4. Create `tests/unit/primitives/<Name>.test.ts` with:
   - default render
   - keyboard interaction (Tab, Enter/Space, arrows where relevant)
   - ARIA attribute assertions
   - disabled / variant paths
5. Run `pnpm test --run` and `pnpm typecheck`.
6. Any motion uses `--dur-*` / `--ease-*` tokens, animates only
   `transform` / `opacity`, and collapses under `prefers-reduced-motion`.
7. If the component introduces a new color/shadow → add the token
   to `tokens.css` first (`docs/03-tailwind-tokens.md`).

## Acceptance

- Lint, typecheck, unit tests all green.
- Exported from `primitives/index.ts`.
- A11y role correct; focus visible via `.focus-ring`.
