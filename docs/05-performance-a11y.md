# 05 — Performance + accessibility

## Performance budgets

| Metric                          | Budget  |
| ------------------------------- | ------- |
| JS shipped on `/` (gzipped)     | ≤ 90 KB |
| CSS shipped on `/` (gzipped)    | ≤ 25 KB |
| Largest image on `/`            | ≤ 60 KB |
| LCP on slow 4G (Moto G4)        | ≤ 2.5s  |
| INP                             | ≤ 200ms |
| CLS                             | ≤ 0.05  |
| Lighthouse Performance (mobile) | ≥ 90    |

Enforced manually until we wire `@lhci/cli` in CI.

## Hydration

- Only **one island** (`<Desktop client:load />`) on `/`.
- All apps are `React.lazy` — Terminal is not downloaded until
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
  React state per `pointermove` — the window-manager's `move`
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
