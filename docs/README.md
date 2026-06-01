# Architecture & Engineering Foundation — Retro

This folder is the **single source of truth** for how the Retro
portfolio is engineered. Anything that conflicts with these docs
should be either fixed in code or proposed as an ADR.

## Index

| #   | Document                                                         | Owner    |
| --- | ---------------------------------------------------------------- | -------- |
| 00  | [Framework decision: Astro vs Remix](./00-framework-decision.md) | Arch     |
| 01  | [System architecture](./01-architecture.md)                      | Arch     |
| 02  | [Design system](./02-design-system.md)                           | Design   |
| 03  | [Tailwind v4 token system](./03-tailwind-tokens.md)              | Design   |
| 04  | [Testing strategy](./04-testing-strategy.md)                     | QA       |
| 05  | [Performance + accessibility](./05-performance-a11y.md)          | Platform |
| 06  | [Development workflow](./06-workflow.md)                         | Platform |
| 07  | [Roadmap](./07-roadmap.md)                                       | PM       |
| 08  | [Conventions](./08-conventions.md)                               | All      |

ADRs live in [./adrs/](./adrs/). New non-trivial choices land as
a numbered ADR before code.
