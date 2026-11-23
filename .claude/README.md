# Claude Code — agents & skills

This directory powers the AI development workflow for the
Retro portfolio.

## Layout

```
.claude/
├── agents/      # specialist personas, invoked per task
├── skills/      # reusable playbooks, one folder each: <name>/SKILL.md
└── templates/   # starting points for new agents and skills
```

Each **agent** is a Markdown file with YAML frontmatter
(`name`, `description`, `tools`, `model`). Each **skill** is a
folder holding a `SKILL.md` playbook (frontmatter `name`,
`description`) that a human or an agent can follow step-by-step.
Claude Code only discovers skills in that folder layout, and
matches tasks to them by `description`. Templates live outside
`agents/` and `skills/` so they are not loaded as real ones.

The same definitions are mirrored to `.github/chatmodes/` for
GitHub Copilot Chat, so the team can work in either client.

## How to use

- In Claude Code, type `@<agent-name>` to scope a request to
  that agent (e.g. `@retro-os-designer add a tray clock`).
- Or invoke a skill: `/review-pr`. Claude also loads a skill on
  its own when a task matches its `description`.

## Adding agents / skills

1. Copy `templates/agent.md` to `agents/<name>.md`, or
   `templates/skill.md` to `skills/<name>/SKILL.md`.
2. Keep them surgical — one job, one persona.
3. Mirror to `.github/chatmodes/<same-name>.chatmode.md`.
