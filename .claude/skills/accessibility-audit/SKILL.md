---
name: accessibility-audit
description: Full a11y pass against the current build.
---

# Skill — accessibility audit

1. `pnpm build && pnpm preview` (or use dev server).
2. Run `pnpm e2e -- --grep "a11y"` for the axe pass.
3. Manually:
   - Tab through the desktop from page load with no mouse.
   - Open each app via keyboard, interact, close.
   - Verify focus returns to the launcher.
   - Toggle reduced-motion in OS, reload, verify boot collapses.
   - Toggle dark theme, verify focus ring still visible.
4. Report:
   - Axe violations (severity + node).
   - Keyboard gaps with steps to reproduce.
   - Contrast issues against AA for body text + form labels.
5. File issues or open a PR with fixes; reference `docs/05-performance-a11y.md`.
