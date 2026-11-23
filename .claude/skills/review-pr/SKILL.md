---
name: review-pr
description: Run the standard senior-review pass on the current diff.
---

# Skill — review a PR

1. Get the diff (`git diff origin/main...HEAD`).
2. Read `docs/06-workflow.md` PR standards.
3. Walk every file and run the skills that apply:
   - colours / tokens → `tailwind-token-usage`
   - anything visible → `design-system-compliance`
   - new primitive → `enforce-architecture` + `accessibility-audit` + `generate-tests`
   - new app → `enforce-architecture` + `generate-tests` + `performance-audit`
   - motion → `animation-review`
   - 3D → `three-asset-pipeline`
   - config / CI → `pnpm run ci` still green, actions pinned, new env vars have a default and a doc
4. On every diff, also check:
   - scope matches the title; a refactor hidden in a feature PR gets split out
   - no dead code, commented-out blocks or leftover `console.log`
   - names say what things are
   - tests, docs and ADRs present where `docs/06-workflow.md` asks
5. Produce a single review comment with:
   - **Verdict:** approve / request changes
   - **Summary:** one sentence
   - **Findings:** grouped by skill or concern
   - **Required fixes** vs **Nits**
6. If the diff is > 400 lines or covers more than one concern,
   request a split before reviewing further.
