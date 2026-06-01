# ADR 0004 — Svelte 5 over React for the desktop island

- **Status:** Accepted (2026-06-01)
- **Supersedes:** the React parts of ADR 0003 (window manager
  remains; its host framework changes).

## Decision

Drop React (and Zustand) entirely. Astro is the default; the
desktop shell and its interactive apps are written in Svelte 5
(runes). One `client:load` island (`Desktop.svelte`) owns all
hydration. Static apps render server-side as Astro components
into inert `<template>` elements and are injected into windows
via `{@html}` on open.

## Why

- **One island, less JS.** Each window used to be (or could
  trivially become) its own React tree under the same store.
  A single Svelte island with a shared `writable` store removes
  Provider plumbing, double-hydration, and per-window React
  runtimes.
- **Astro-first content.** The original plan let static apps
  drift toward React out of convenience. Astro components have
  zero runtime cost; the registry's discriminated union
  (`kind: "static" | "svelte"`) makes the static path the
  default and the interactive path explicit.
- **Svelte 5 runes** (`$state`, `$derived`, `$effect`) match
  the imperative shape of windowing/drag/boot-sequence code
  better than React's render-and-reconcile model, and remove
  the need for refs and `useEffect` correctness rituals.
- **Smaller dep surface.** Removed: `react`, `react-dom`,
  `zustand`, `@astrojs/react`, `@types/react*`,
  `@vitejs/plugin-react`, `@testing-library/react`,
  `@testing-library/user-event`, `eslint-plugin-react`,
  `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`.
  Added only `@astrojs/svelte`, `svelte`, `svelte-check`,
  `eslint-plugin-svelte`, `prettier-plugin-svelte`,
  `@testing-library/svelte`, `@sveltejs/vite-plugin-svelte`.

## Alternatives

- **Stay on React.** Works, but every static app pays a React
  runtime tax and Astro's zero-JS story degrades.
- **Solid.** Closest in spirit to Svelte 5 runes; rejected on
  smaller ecosystem and weaker Astro integration.
- **Vue / Preact.** Either would work; neither is materially
  better than Svelte for this workload and both keep us in a
  VDOM model.
- **Vanilla / web components for the desktop.** Considered.
  The store + window-list reactivity is real work; reinventing
  it costs more than the framework it would replace.

## Consequences

- The window manager is now a Svelte `writable` (`get` /
  `subscribe` / action functions). Its public API is
  preserved; only the import path and call site shape changed.
- Drag/resize lives inside `RetroWindow.svelte`. If a second
  consumer ever needs drag, it gets extracted into
  `src/lib/actions/drag.ts` as a Svelte action — not before.
- `prefers-reduced-motion` / media-query readables don't exist
  yet; they will be added under `src/lib/stores/` when an
  island actually needs them.
- React is forbidden in `src/`. CI `git grep -i 'from "react"'`
  must return empty (enforced by ESLint flat config + the
  absence of any React-aware plugins).
- The registry's `kind` discriminator is load-bearing: adding
  an app means choosing static (Astro) or interactive
  (Svelte). The static path stays the default.
