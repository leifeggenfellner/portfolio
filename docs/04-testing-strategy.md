# 04 — Testing strategy

## The rule

Write a test when the code has **real logic or a real failure mode**:
state machines (window layout, boot, focus, keymap scopes), parsers
and persistence (settings, the terminal shell, content), algorithms
(Minesweeper, fuzzy search, snapping maths, pipes), and the user
flows that would break the site if they regressed. A regression
that once happened gets a test.

Don't write one for wiring, markup, styling, copy, a one-line
helper, or a component that only passes props through. No coverage
targets (see Coverage below).

## Where tests live

### Unit (Vitest, `happy-dom`)

- `tests/unit/os/` — the kernel: window manager, keymap, boot,
  settings, and a regression for binding from effects.
- `tests/unit/apps/` — app logic: terminal shell and filesystem,
  toys, pipes, Minesweeper, the generated Settings form.
- `tests/unit/lib/` — parsers, persistence, maths: settings and the
  bootstrap script, palette, fuzzy, horizon budget, window bounds,
  motion (including a stalled animation), JSON-LD escaping.
- `tests/unit/primitives/`, `tests/unit/shell/` — only behaviour:
  keyboard handling, dragging and resizing, crash containment.

### E2E (Playwright)

Every flow runs on Chromium (`chromium-desktop`). The other
projects run only flows tagged for them, where the engine or
device behaves differently:

| Project          | Tag       | Covers                                         |
| ---------------- | --------- | ---------------------------------------------- |
| `webkit-desktop` | `@webkit` | focus and motion in Safari's engine            |
| `mobile-iphone`  | `@mobile` | phone layout, touch, full-screen windows, Back |
| `reduced-motion` | `@motion` | motion collapsing under the preference         |
| `visual`         | —         | screenshots of the chrome (see below)          |

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
- Every engine runs with motion. Enter and exit transitions go
  through `motion()` (`src/lib/motion.ts`), which finishes a
  stalled animation on a timer, so a closed window is always
  removed.
- Assertions that wait on canvas frames allow 15 s.
- The bar: five full local runs in a row with no failure and no
  retry.

### Visual regression

- `tests/e2e/visual.spec.ts`: two windows (active and inactive),
  the Start menu and the palette, in both themes; CRT off, the
  wallpaper canvas hidden, the clock and build badge masked.
- Runs in CI only (or with `VISUAL=1`): screenshots compare only on
  the renderer they were taken with. Regenerate the baselines with
  `scripts/update-visual-baselines.sh`, which runs the Playwright
  container that matches CI.
- Tolerance: 1% of pixels.

### Animation

- Animations are state machines. We test the state, not the
  pixels. `BootSequence` exposes lifecycle via `onDone`; tests
  drive timers with `vi.useFakeTimers()`.

## Coverage

No coverage targets. Tests exist for code with real logic or a real
failure mode, and for the flows that would break the site; a number
would only reward tests of things that can't meaningfully fail.
`pnpm test:cov` still reports coverage, as a way to spot risky
logic that has no test yet.

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
