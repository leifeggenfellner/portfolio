# 02 — Design system

The retro-os mockups in `/retro-os/` are the **visual source of
truth**. They are not shipped. Tokens, primitives, and effects
in `src/` are the **engineering source of truth** and must match
the mockups; when they disagree, the mockups are updated first.

## Visual direction

**Vaporwave OS.** Dusk-lavender chrome, magenta→cyan title-bar
gradients, neon accent on selection and meters. CRT layer is
always on (subtle by default, "full" in dark theme), and a
~4-second cinematic boot plays on first session visit.

Typography: **Pixelify Sans** (chrome) / **VT323** (mono /
terminal) / **Inter** (body). All loaded from Google Fonts
with `display=swap` to avoid FOIT.

## Component taxonomy

### Primitives (`src/components/primitives/`)

The reusable kit. Presentational, variant- or compound-driven,
zero portfolio content.

- `RetroButton` — variant: default|primary|ghost|icon, size: sm|md|lg|icon
- `RetroCard` — compound `RetroCard.Title` / `RetroCard.Body`
- `WindowHeader` — title bar with system buttons
- `RetroWindow` — draggable / focusable / resizable frame
- `GroupBox` — fieldset-style sunk frame
- `Tabs` — ARIA tablist with roving tabindex
- `Tooltip` — hover/focus yellow note
- `ContextMenu` + `useContextMenu`
- `Modal` — focus-trapped dialog
- `DesktopIcon`
- `ProgressBar` — chunky segmented

### Effects (`src/components/effects/`)

Visual side-effects with no business logic.

- `Wallpaper` — vaporwave sky + neon sun + perspective grid
- `CrtLayer` — scanlines / vignette / glow / noise
- `BootSequence` — cinematic startup

### Apps (`src/components/apps/`)

Composed portfolio surfaces. Each is a default export consumed
by the shell via `registry.ts`. Apps may import primitives and
hooks but never other apps.

- About, ProjectsExplorer, Terminal, SkillsMatrix, ContactTerminal, MiniGame

### Shell (`src/components/shell/`)

The actual desktop runtime: window manager wiring, Taskbar,
StartMenu, Dock, CommandPalette, AppErrorBoundary.

## Extraction rules — turning a mockup into a primitive

1. **Find the repetition.** If a visual pattern appears in ≥ 3
   composed places, it's a candidate primitive.
2. **Token-first.** No raw colors, sizes, or shadows. Add a
   token before adding a class.
3. **Variant or compound, never prop explosion.** If you need
   more than ~6 props, you probably need composition.
4. **Bevel is the foundation.** Anything raised gets `bevel-out`,
   anything sunk gets `bevel-in`. Don't reinvent borders.
5. **A11y is not a follow-up.** Each primitive ships with: a
   semantic role, keyboard support, focus styling, and a unit
   test that exercises both.

## Theming

- Themes are activated by `[data-theme="light|dark"]` on `<html>`.
- CRT intensity by `[data-crt="off|subtle|full"]`.
- Accent swap by `[data-accent="default|magenta|cyan|amber"]`.
- All three are persisted to `localStorage` by the Tweaks panel
  (TODO).

## Anti-patterns

- ❌ Reaching into `surface-3` from a primitive — use `var(--surface)`.
- ❌ Hard-coded hex / rem in a component — token it.
- ❌ Per-component theme override — extend the theme.
- ❌ One-off animation keyframes inline — promote to `effects.css`.
- ❌ Apps importing other apps — go through the shell.
