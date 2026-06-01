# Claude Code — agents & skills

This directory powers the AI development workflow for the
Retro portfolio.

## Layout

```
.claude/
├── agents/    # specialist personas, invoked per task
└── skills/    # reusable playbooks (PR review, a11y audit, ...)
```

Each **agent** is a Markdown file with YAML frontmatter
(`name`, `description`, `tools`, `model`). Each **skill** is a
Markdown playbook a human or an agent can follow step-by-step.

The same definitions are mirrored to `.github/chatmodes/` for
GitHub Copilot Chat, so the team can work in either client.

## How to use

- In Claude Code, type `@<agent-name>` to scope a request to
  that agent (e.g. `@retro-os-designer add a tray clock`).
- Or invoke a skill: `run skill: review-pr` and follow the steps.

## Adding agents / skills

1. Read `agents/_template.md` or `skills/_template.md`.
2. Keep them surgical — one job, one persona.
3. Mirror to `.github/chatmodes/<same-name>.chatmode.md`.
