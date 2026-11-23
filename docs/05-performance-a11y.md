# 05 — Performance + accessibility

## Performance budgets

| Metric                          | Budget  |
| ------------------------------- | ------- |
| JS shipped on `/` (gzipped)     | ≤ 90 KB |
| CSS shipped on `/` (gzipped)    | ≤ 25 KB |
| Largest image on `/`            | ≤ 60 KB |
| LCP on slow 4G (Moto G4)        | ≤ 2.5s  |
| INP                             | ≤ 200ms |
| TBT (lab stand-in for INP)      | ≤ 200ms |
| CLS                             | ≤ 0.05  |
| Lighthouse Performance (mobile) | ≥ 90    |

Enforced in CI:

- **Bundle size:** `pnpm size` (`scripts/check-bundle.mjs`) follows
  the static imports from `dist/index.html` and fails the build job
  when the initial JS or CSS is over budget. It also lists the lazy
  app chunks. Both go in the job summary; it runs in `pnpm run ci`
  too.
- **Lighthouse:** the `lighthouse` job runs `@lhci/cli` three times
  each on mobile and desktop against the built site and asserts
  the performance score, LCP, CLS and TBT budgets
  (`lighthouserc.mobile.json`, `lighthouserc.desktop.json`).
  Results go in the job summary; the full reports are uploaded as
  an artifact.
- **Mobile LCP in CI is a 3 s guard, not the 2.5 s target.** The
  LCP element is the boot splash heading, which appears once the
  desktop island hydrates, so simulated slow 4G puts it near
  2.5 s, and shared CI runners measure about 0.7 s slower than a
  laptop (2.52 s against 1.8 s for the same build). A 2.5 s gate
  there would fail at random; 3 s still catches a real
  regression.

The image budget and real-device INP are still checked by hand.

## Hydration

- Only **one island** (`<Desktop client:load />`) on `/`.
- All Svelte apps are dynamic imports — Terminal is not downloaded until
  Terminal is opened.
- No third-party scripts. Fonts are self-fetched from Google
  Fonts (or self-hosted later — see roadmap).

## Image strategy

- SVGs for icons, sprites, and the favicon.
- `astro:assets` `<Image />` for any raster content (project
  thumbnails). Always emit AVIF + WebP, with explicit width /
  height to prevent layout shift.
- Never load images for purely decorative chrome — use CSS.

## Animation performance

- Window drag uses native pointer events; we do **not** trigger
  component state per `pointermove` — the window-manager's `move`
  call is rate-limited by the browser's event loop already, and
  the moved element is the only thing that re-renders thanks to
  controlled props.
- All keyframes animate `transform` and `opacity` only.
- CRT scanlines/flicker run on the GPU (background-position +
  opacity).

## Accessibility — non-negotiables

1. **Keyboard parity.** Every action reachable by mouse is
   reachable by keyboard. Test via `tests/e2e/keyboard.spec.ts`.
2. **Focus visible.** `.focus-ring` is the only focus style.
   Never `outline: none` without replacing it.
3. **Focus management.** Modals trap; closing returns focus to
   the launching element. The window manager focuses a sensible
   element on open and restores on close.
4. **Screen reader.** Windows are `role="dialog"` with
   `aria-label`. Title bars announce active/inactive state via
   visible text. Taskbar items use `aria-pressed`.
5. **Reduced motion.** `prefers-reduced-motion: reduce` collapses
   boot to a 200ms fade, disables scanline animation, and
   removes window-open scale animation (kept in CSS).
6. **Contrast.** The vaporwave theme intentionally bends contrast
   rules in chrome — body text, links, and form labels must
   still pass WCAG AA. Track in [a11y/contrast-exceptions.md](./contrast-exceptions.md).
7. **No motion auto-loops** > 5s without an off control.
8. **Skip-to-content** link from the home route into the active
   window contents.

## Mobile

`(max-width: 768px)` switches the shell to: single full-screen
window + bottom dock, no drag, no resize, no boot scanline
animation. Verified in Playwright `mobile-iphone` project.
