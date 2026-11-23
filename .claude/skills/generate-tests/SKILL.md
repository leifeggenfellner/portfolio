---
name: generate-tests
description: Add the tests a change on the current branch needs, and only those, following this repo's lean testing rule and layout.
---

# Skill — generate tests

The rule (docs/04-testing-strategy.md): test code with real logic or a
real failure mode, and the user flows that would break the site. Don't
test wiring, markup, styling, copy, one-line helpers or pass-through
components. No coverage targets.

1. Compute changed files: `git diff --name-only origin/main...HEAD`.
2. For each change, ask: can this break in a way that isn't obvious
   from reading it? State machines, parsers, persistence, algorithms,
   keyboard handling, a bug that already happened once: yes. Markup,
   styles, copy, a component that passes props through: no test.
3. Unit tests go in `tests/unit/{os,apps,lib,primitives,shell}/`.
   Test the behaviour through the public API, not the implementation.
4. A new user flow gets one Playwright test on Chromium. Tag it
   (`{ tag: ["@webkit"] }`, `@mobile`, `@motion`) only if it behaves
   differently on that engine or device.
5. Use `userEvent` over `fireEvent`. Prefer `getByRole`, in E2E too.
6. Keep tests deterministic: fake timers for animations (never a real
   sleep), injected randomness. No snapshot tests for visual output;
   the `visual` project covers the shared chrome.
7. Run `pnpm test` and the affected Playwright specs.
