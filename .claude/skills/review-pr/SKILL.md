---
name: review-pr
description: Run the standard senior-review pass on the current diff.
---

# Skill — review a PR

1. Get the diff (`git diff origin/main...HEAD`).
2. Read `docs/06-workflow.md` PR standards.
3. Walk every file. For each, decide which agent owns it:
   - tokens / theme → `tailwind-theme-architect`
   - new primitive → `ui-architect` + `accessibility-reviewer` + `test-engineer`
   - new app → `ui-architect` + `test-engineer`
   - motion → `animation-engineer`
   - config / CI → `dx-infra`
4. Apply each agent's review checklist.
5. Produce a single review comment with:
   - **Verdict:** approve / request changes
   - **Summary:** one sentence
   - **Findings:** grouped by agent
   - **Required fixes** vs **Nits**
6. If the diff is > 400 lines or covers more than one concern,
   request a split before reviewing further.
