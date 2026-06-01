# 03 — Tailwind v4 token system

## Why CSS-first tokens

Tailwind v4 lets us declare tokens in CSS via `@theme`. Combined
with `@theme inline { … }`, Tailwind generates utilities that
resolve to **live `var(--token)` references** — flipping
`[data-theme]` re-themes the whole UI without a rebuild.

Token flow:

```
tokens.css            globals.css              utility output
─────────             ─────────────────        ─────────────────
:root { --accent }  → @theme inline {        →  .bg-accent {
[data-theme="dark"]      --color-accent:           background:
  { --accent: … }        var(--accent);            var(--accent);
                       }                         }
```

## Token categories

| Category   | Examples (CSS var)                        | Tailwind utility                        |
| ---------- | ----------------------------------------- | --------------------------------------- |
| Colors     | `--surface`, `--accent`, `--text-dim`     | `bg-surface`, `text-text-dim`           |
| Bevels     | `--bevel-light`, `--bevel-shadow`         | `border-bevel-shadow`                   |
| Fonts      | `--font-chrome`, `--font-mono`            | `font-chrome`                           |
| Font sizes | `--fs-12` … `--fs-48`                     | `text-12` … `text-48`                   |
| Spacing    | `--sp-1` … `--sp-8`                       | `p-3`, `gap-4`                          |
| Radii      | `--radius-0`, `--radius-1`, `--radius-2`  | `rounded-0`                             |
| Shadows    | `--win-shadow`, `--field-glow`            | `shadow-window`                         |
| Z-index    | `--z-window`, `--z-taskbar`, `--z-crt`    | `z-[var(--z-crt)]`                      |
| Motion     | `--ease-snap`, `--dur-1..4`, `--dur-boot` | `ease-[var(--ease-snap)]`, `duration-2` |

## Rules

1. **No raw colors.** `#fff`, `rgb(...)`, `oklch(...)` only
   inside `tokens.css`. Everywhere else: a token.
2. **No `style={{ color: '#...' }}`.** If a one-off color is
   truly needed, add the token first and reference it.
3. **Variants over conditional classes.** Prefer
   `dark:bg-surface-3` to runtime `data-theme` checks in JS.
4. **No `!important` outside `tokens.css` / `globals.css`.**
5. **One naming convention.** `--surface`, `--surface-2`, never
   `--surface--dark`. Theming happens via `[data-theme]`.

## Adding a token

1. Add the variable to `src/styles/tokens.css` (both themes).
2. If you want a Tailwind utility for it, mirror it in
   `globals.css` `@theme inline { … }`.
3. Run `pnpm typecheck` (no codegen needed — Tailwind v4 is JIT).
4. Reference the utility (`bg-mything`) or the var (`var(--mything)`).

## Removing a token

1. `grep -r "--token-name" src/` — must be zero matches outside
   `tokens.css` / `globals.css`.
2. Delete from `tokens.css` and `globals.css`.
3. Add a CHANGELOG note if it was public.
