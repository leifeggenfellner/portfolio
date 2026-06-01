---
name: responsive-audit
description: Verify mobile + tablet + desktop adaptations.
---

# Skill — responsive audit

1. Run Playwright with `--project=mobile-iphone` and
   `--project=chromium-desktop`.
2. Manually verify breakpoints at 375, 768, 1024, 1440, 1920.
3. Confirm `(max-width: 768px)` collapses to single fullscreen
   window + bottom dock with no drag/resize affordances.
4. Confirm wallpaper + CRT layer still render correctly.
5. Confirm focus order and reading order stay correct.
6. File any issues with a screenshot per breakpoint.
