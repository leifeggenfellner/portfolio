---
name: design-system-compliance
description: Verify a change matches the retro-os mockups and the published design rules.
---

# Skill — design-system compliance

1. Locate the relevant mockup in `/retro-os/` (component or
   composition). If none exists, request one.
2. Diff the implementation against the mockup:
   - bevels, gradients, typography, spacing
   - hover / pressed / focus states
   - dark theme parity
3. Verify token usage:
   - no raw colors
   - no off-scale font sizes / spacing
4. Verify the change covers both light and dark themes.
5. Report a "matches mockup ✓" or a list of deltas.
