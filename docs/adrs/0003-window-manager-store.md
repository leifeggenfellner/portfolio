# ADR 0003 — Window manager via Zustand store

- **Status:** Accepted (2026-05-29)

## Decision

Use a single Zustand store (`src/lib/store/window-manager.ts`)
as the source of truth for every open window's geometry,
z-index, focus, and lifecycle.

## Why

- Multiple components (Desktop, Taskbar, StartMenu, Dock,
  CommandPalette) need to read and mutate the same window
  list. Context with `useReducer` would force every consumer
  to re-render on any change.
- Zustand gives selector-level subscriptions, ~1KB, no
  Provider gymnastics.
- Window components stay **controlled** by the store, which
  makes them trivially testable in isolation.

## Alternatives

- React Context + reducer — fine, but selectivity is hand-rolled.
- Jotai — atomic model is overkill for one cohesive store.
- Redux Toolkit — too much surface for this size.

## Consequences

- Adding "split view" / "save session" features is a store
  change, not a refactor of every consumer.
- Persistence is one `persist()` middleware call away.
- SSR-safe because the store is only read inside the
  Desktop island.
