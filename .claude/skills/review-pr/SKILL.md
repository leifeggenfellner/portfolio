---
name: review-pr
description: Review the current branch against this repo's house rules (tokens, motion, mockups, layering, scope) before merge. Use for "review my PR/branch/diff".
---

# Skill — review a PR

Layer rules are enforced by ESLint and type safety by `pnpm
typecheck`; this pass covers what CI cannot see.

1. Get the diff (`git diff origin/main...HEAD`).
2. Read `docs/06-workflow.md` PR standards.
3. **Tokens** (hard rule 2). Search the diff's files for raw values:
   ```sh
   rg -n "#[0-9a-fA-F]{3,8}\b|rgba?\(|oklch\(" src --glob '!src/styles/**'
   ```
   Each hit moves to an existing token, or a new one in
   `tokens.css` (light and dark) per `docs/03-tailwind-tokens.md`.
   A value used twice needs a token.
4. **Visuals.** Anything visible matches its `retro-os/` mockup
   (bevels, gradients, type, spacing, hover/pressed/focus) and works
   in both light and dark themes.
5. **Motion** (hard rule 4). Only `transform` / `opacity` on hot
   paths; durations and easings from `--dur-*` / `--ease-*`;
   `prefers-reduced-motion` collapses or disables it (the
   `reduced-motion` Playwright project covers boot); looping motion
   has an off switch or stops by itself.
6. **Interaction** (hard rule 5). New controls are reachable by Tab,
   show the focus ring, and Escape closes what it opened.
7. **Scope and code.**
   - Scope matches the title; a refactor hidden in a feature PR gets
     split out.
   - No dead code, commented-out blocks or leftover `console.log`.
   - Names say what things are.
   - Tests, docs and ADRs present where `docs/06-workflow.md` asks;
     new runtime dependency has an ADR (hard rule 1).
   - Config / CI: actions pinned, new env vars have a default and a
     doc.
8. Run the matching skills: `generate-tests` for missing tests,
   `accessibility-audit` for new UI, `responsive-audit` for layout
   changes, `performance-audit` for new apps or dependencies,
   `three-asset-pipeline` for 3D.
9. Produce a single review comment with:
   - **Verdict:** approve / request changes
   - **Summary:** one sentence
   - **Findings:** grouped by concern
   - **Required fixes** vs **Nits**
10. If the diff is > 400 lines or covers more than one concern,
    request a split before reviewing further.
