# 08 — Conventions

Coding conventions, one screen.

## TypeScript

- `strict: true`, `noUncheckedIndexedAccess: true`,
  `verbatimModuleSyntax: true`. No `any`, no `as` lies.
- `type` for unions and shapes you don't subclass; `interface`
  for component props.
- `import type { … }` for type-only imports (enforced by ESLint).
- No default exports for libs / utilities. **Apps and Astro
  pages may default-export** (Astro requires it).

## Naming

| Kind           | Convention                  | Example                         |
| -------------- | --------------------------- | ------------------------------- |
| Component file | `PascalCase.tsx`            | `RetroButton.tsx`               |
| Hook file      | `use-kebab.ts`              | `use-drag.ts`                   |
| Util file      | `kebab.ts`                  | `cx.ts`                         |
| Token CSS var  | `--kebab`                   | `--bevel-shadow`                |
| Tailwind class | utility-first, mobile-first | `flex items-center md:flex-row` |
| Test file      | `<Source>.test.tsx`         | `RetroButton.test.tsx`          |

## Component architecture

- Compound > prop-bloat. (`<RetroCard>` + `RetroCard.Title`.)
- Variant > boolean flags. (`variant="primary"` not `primary`.)
- Controlled > uncontrolled for anything the parent might care
  about (windows are controlled by the manager).
- Each primitive has a one-paragraph JSDoc at the top covering
  purpose, composition, and a11y.
- Side-effects are isolated to `useEffect` and clean themselves
  up. Always.

## Hooks

- One concern per hook. If a hook returns more than ~4 things,
  split it.
- Hooks live in `src/lib/hooks/` and are SSR-safe (guard with
  `useEffect`).

## Styling

- Tailwind utilities first; fall back to a `.bevel-*` class.
- No inline `style` except for **dynamic** computed values
  (drag position, gradient color from props, animation
  duration). Static visual style → utility class.
- No CSS modules; the system is too small to justify them.

## Imports

- Use path aliases (`@primitives/...`, `@lib/...`). Never reach
  into `src/...` with a relative `../../..` from outside the
  same folder.
- Order: external → aliased → relative → styles. ESLint sorts.

## Composition patterns

- "If you'd write more than two `if`s in render, extract a
  variant or compound child."
- Slots > render props for layout. (`right={<Foo/>}` over
  `renderRight={() => <Foo/>}`.)

## Error handling

- Errors are values at the boundary (form validation), not
  exceptions.
- Real exceptions are caught by the per-app `AppErrorBoundary`.
- Never swallow errors silently in dev — use `console.warn` /
  `console.error`.

## Performance constraints

- No expensive work in render. `useMemo` real cost only.
- `React.lazy` every app.
- No icon libraries — use emoji glyphs or hand-authored SVG
  sprites.

## Anti-patterns (auto-rejected in review)

- `any`, `as unknown as X`, `@ts-ignore` without a comment.
- `style={{ color: '#ff5fd2' }}` — token it.
- New CSS files outside `src/styles/`.
- Component file > 250 lines without a refactor justification.
- New runtime dependency without an ADR.
