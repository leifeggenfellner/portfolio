# 00 — Framework decision: Astro vs Remix

**Decision: Astro.** Recorded in [ADR-0001](./adrs/0001-astro-over-remix.md).

## TL;DR

Retro is a **mostly static portfolio with pockets of dense
interactivity** (window manager, terminal, command palette,
boot sequence). That shape is exactly what Astro's island
architecture was designed for. Remix would force us to ship a
React runtime to deliver a static brochure.

## Scoring matrix

| Concern               | Weight | Astro                              | Remix                           |
| --------------------- | ------ | ---------------------------------- | ------------------------------- |
| Static / GH Pages fit | ★★★    | Native static                      | Needs adapter / external server |
| JS shipped by default | ★★★    | ~0 KB                              | Full React app                  |
| Animation-heavy hero  | ★★     | Hydrate one island (`client:load`) | Same DX, more cost              |
| Routing               | ★      | File-based, simple                 | Powerful nested, overkill here  |
| SEO + meta            | ★★★    | First-class SSG                    | Good, but pays runtime          |
| Content (MDX + TS)    | ★★★    | First-class content collections    | DIY                             |
| Interactivity ceiling | ★★     | Islands cover everything we need   | Slightly higher                 |
| Deploy simplicity     | ★★★    | `astro build` → `dist/` → GH Pages | Needs server or static adapter  |
| Maintainability       | ★★     | Smaller surface                    | Larger surface                  |
| Long-term scaling     | ★★     | Add more islands                   | Already a full app              |

## Why not Remix

Remix shines when **every page is dynamic, server-rendered, and
form-heavy** (dashboards, e-commerce). A portfolio is the
opposite shape: a small number of mostly-static pages with one
extremely interactive surface. Shipping a full React runtime
for the About and Posts routes is wasted bytes.

## Where Astro could bite us

- The window manager + terminal must live inside a single React
  island so they share zustand state. Cross-island state requires
  discipline. **Mitigation:** the Desktop is one island.
- `client:load` for the Desktop trades island-architecture
  savings for immediate hydration. That is intentional — the
  desktop _is_ the hero. Everything **outside** the desktop
  (future blog routes, project case studies) stays static.

## Revisit conditions

Switch evaluation to Remix / Next if any are true:

- We add per-visitor server-rendered content (CMS preview, auth).
- Multiple deeply nested dynamic routes appear.
- We need streaming SSR for first-contentful-paint reasons.
