# Claude Code — skills

This directory powers the AI development workflow for the
Retro portfolio.

## Layout

```
.claude/
├── skills/      # reusable playbooks, one folder each: <name>/SKILL.md
└── templates/   # starting point for new skills
```

Each **skill** is a folder holding a `SKILL.md` playbook
(frontmatter `name`, `description`) that a human or an agent can
follow step-by-step. Claude Code only discovers skills in that
folder layout, and matches tasks to them by `description`. The
template lives outside `skills/` so it is not loaded as a real one.

## How to use

- Invoke a skill directly: `/review-pr`.
- Claude also loads a skill on its own when a task matches its
  `description`.

## Adding a skill

1. Copy `templates/skill.md` to `skills/<name>/SKILL.md`.
2. Keep it surgical — one job per skill.
