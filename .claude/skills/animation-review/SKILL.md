---
name: animation-review
description: Audit motion in the current diff.
---

# Skill — animation review

For every change involving `@keyframes`, `transition`,
`animation`, or motion props:

1. Verify it animates only `transform` and/or `opacity` on
   hot paths.
2. Verify duration uses `--dur-*` tokens.
3. Verify `prefers-reduced-motion` collapses or disables it.
4. Verify looping animations have an off control (Tweaks panel,
   data attribute, or auto-stop).
5. Profile a 5-second capture in DevTools Performance; assert
   no long tasks > 50ms and 60fps sustained.
6. Report findings; if any fail, propose a fix.
