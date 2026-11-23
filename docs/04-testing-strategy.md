# 04 — Testing strategy

## Test pyramid

```
        E2E (Playwright)            ◄ 5%   smoke + critical journeys
   Component (Vitest + RTL)         ◄ 20%  primitives + app shells
   Logic/unit (Vitest)              ◄ 75%  store, hooks, parsers
```

## What we test

### Unit (Vitest, `happy-dom`)

- `lib/store/window-manager` — every action.
- `lib/hooks/*` — return values + cleanup.
- Component logic for primitives: render, keyboard, ARIA roles,
  state transitions, disabled paths.

### Component

- Every primitive ships at least one `*.test.ts` (Testing Library for Svelte) exercising:
  - default render
  - keyboard interaction (`Tab`, `Enter`, `Escape`, arrows where
    relevant)
  - ARIA attributes
  - disabled/active variants

### E2E (Playwright)

- `desktop.spec.ts` — boot → skip → open app → window visible.
- `keyboard.spec.ts` — full keyboard nav from page load to
  closing a window (no mouse).
- `mobile.spec.ts` — `iPhone 14` device, single-window layout.
- `reduced-motion.spec.ts` — boot collapses, no scanline animation.

### Accessibility

- Axe via `@axe-core/playwright` with `color-contrast` on, for
  the desktop, every app window (both themes) and every document
  page. Wait for a window's opening animation to finish first, or
  axe measures it while the wallpaper still shows through.
- Text drawn straight on the wallpaper is measured against the real
  pixels in `contrast.spec.ts`, since axe can't see through
  gradients and scanlines (see
  [contrast-exceptions.md](./contrast-exceptions.md)).

### Stability

- The WebKit projects run with at most 2 workers
  (`playwright.config.ts`): headless WebKit starves timers and
  animation frames when many instances share the CPU.
- Assertions that wait on canvas frames allow 15 s.
- The bar: five full local runs in a row with no failure and no
  retry.

### Visual regression (future)

- Playwright `toHaveScreenshot()` for boot frame, default
  desktop, and the Tweaks panel open. Track in `tests/visual/`.
- Two thresholds: 0.1% pixel diff for chrome, 1% for CRT scenes.

### Animation

- Animations are state machines. We test the state, not the
  pixels. `BootSequence` exposes lifecycle via `onDone`; tests
  drive timers with `vi.useFakeTimers()`.

## Coverage goals

| Area            | Lines          | Branches |
| --------------- | -------------- | -------- |
| `src/lib/**`    | 90%            | 85%      |
| `primitives/**` | 80%            | 75%      |
| Apps            | best-effort    | —        |
| Shell wiring    | covered by E2E | —        |

Thresholds enforced in `vitest.config.ts`.

## CI expectations

`pnpm run ci` (defined in `package.json`) runs:

1. `pnpm typecheck`
2. `pnpm lint`
3. `pnpm test` (Vitest, coverage)
4. `pnpm build` (Astro)

E2E runs as a separate job after `build`, using `pnpm preview`.

## Local conventions

- Tests live under `tests/unit/` mirroring `src/` (`*.test.ts`).
- Larger suites and E2E live under `/tests/`.
- No snapshot tests for visual output. Use Playwright screenshots
  if a visual is critical.
