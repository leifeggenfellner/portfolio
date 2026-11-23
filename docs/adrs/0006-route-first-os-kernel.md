# ADR 0006 — Route-first desktop and an OS kernel

- **Status:** Accepted (2026-11-23)
- **Supersedes:** the parts of ADR 0003 and ADR 0004 about
  `svelte/store` singletons, the single client-only island and
  static apps injected from `<template>` with `{@html}`. Svelte 5,
  Astro and the static export stay.
- **Tracking:** epic #70.

## Context

The desktop is one `client:load` island (`Desktop.svelte`, ~720
lines) that renders a blank screen until JavaScript arrives. It
owns boot, viewport, icons, focus, snapping, the palette, the
screensaver, theme changes and launching. State lives in
module-level `svelte/store` singletons mirrored into `$state`.
Apps integrate three ways (Astro HTML copied from `<template>`,
Svelte components with an `AppShell` prop, and an intents store
for cross-app requests), and the palette, Start menu, terminal,
help note and `man` each keep their own list of apps. Content
comes from collections on pages and from raw `import.meta.glob`
on the client. Without JavaScript, `/` shows nothing.

## Decision

### 1. Routes are the source of truth

Every app has a URL: `/about/`, `/projects/`,
`/projects/<slug>/`, `/skills/`, `/terminal/`, `/minesweeper/`,
`/contact/`, `/settings/`. Each app route is **the desktop with
that window open**, server-rendered: the wallpaper, icons, taskbar
and the window with its real content are HTML before any script
runs. `/` is the desktop with no window open.

- Without JavaScript, icons are `<a href>` links to app routes and
  a window's close button links to `/`. The site is fully readable.
- With JavaScript, the shell intercepts those links and opens
  windows in place with the History API: opening pushes the app's
  route, focusing replaces it, closing pops it, Back closes the top
  window. A full reload of any URL restores the same window.
- Window layout on phones is CSS (full screen under the mobile
  breakpoint), not render-time overrides, so server HTML and
  hydrated HTML match at every width.
- Posts stay plain document pages (`DocumentLayout`), zero JS.
- The separate "plain page" versions of About and Projects from
  #31 are retired: an app route is the page.

Routes are generated from the app manifests by one
`getStaticPaths`, not written by hand per app.

### 2. An OS kernel of rune classes, provided through context

`src/lib/os/` holds the services, each a class with `$state`
fields, created together by `createOs()` and provided from one
`<Os>` root component through Svelte context:

| Service         | Owns                                                                     |
| --------------- | ------------------------------------------------------------------------ |
| `WindowManager` | windows, stacking (array order), focus history, layout state machine     |
| `Launcher`      | opening apps with typed `args`, loading app code, the route ↔ window map |
| `Keymap`        | every shortcut, in scopes: modal > window > desktop > global             |
| `Settings`      | schema-driven, persisted settings and their root attributes              |
| `Boot`          | the boot phase machine, as an overlay over server-rendered markup        |
| `Viewport`      | size, taskbar height, mobile, pointer type, reduced motion               |
| `Announcer`     | one polite live region for window and system events                      |

Components call `getOs()`; nothing imports a store singleton.
Tests build a fresh kernel per test. The window layout is one
state per window, `floating | snapped(left|right) | maximised`,
with the box to restore to.

### 3. Apps are self-describing modules

```
src/apps/<id>/
  manifest.ts   id, title, icon, routes, default geometry,
                args schema, palette commands, shortcuts, aliases
  App.svelte    the content, used in the window and on the route
  logic.ts      pure logic (optional), unit-tested
```

A registry is generated from the manifests with
`import.meta.glob`. Desktop icons, the Start menu, the palette,
terminal `open`, the help note, `man` and `docs/keyboard.md` are
all derived from the manifests and the keymap. Cross-app requests
("show this project", "run this command") are launch arguments,
not an intents store.

About and Skills become Svelte components like the rest. They
render on the server for their routes, and on the client their
code loads lazily like any other app, so the "static app" path,
the `<template>` elements, `{@html}` and `emitCss: false` all go.

### 4. Content: collections only

Profile, skills, projects and posts are content collections
validated by zod at build. Pages read them with `getCollection`.
The client never parses content: an app's data reaches it through
a build-generated module imported by that app's chunk (so it is
lazy and ships only with the app), produced from the validated
collections.

### 5. Styling: tokens → component layer → utilities

`tokens.css` stays the only source of colours, shadows, sizes and
durations. A small component layer (`@utility` / scoped styles)
defines the shared chrome once: title bars, bevels, window frame,
desktop labels. Utilities are for layout. Each effect's CSS lives
with its component.

### 6. Motion: one helper, guaranteed cleanup

Enter/exit motion goes through one helper that reads duration
tokens, collapses under reduced motion and removes the element on
a timer even if the animation never finishes.

### 7. No runtime third-party requests

Icons are inlined at build time; nothing fetches from another
origin at runtime. A strict Content Security Policy (meta tag)
enforces it.

### 8. Lean tests

Tests guard real logic and real failure modes (state machines,
parsers, persistence, algorithms, the flows that break the site)
and nothing casual. See `docs/04-testing-strategy.md`.

## Alternatives

- **Keep one client-only island, refactor inside it.** Fixes the
  code structure (kernel, manifests) but not the product: no
  content without JavaScript, no deep links, LCP waits for
  hydration. Rejected; the kernel work is shared with the chosen
  path anyway.
- **SvelteKit with `adapter-static`.** A real router, layouts and
  SSR for free, and the whole app is Svelte. But it replaces Astro
  (ADR 0001), its content collections and MDX pipeline, its image
  and font handling, and the zero-JS document pages. The router we
  need is small: one History API listener over routes we already
  generate. Rejected for migration cost and for losing zero-JS
  posts.
- **A client-side SPA router in the island** (hash or
  `pushState`, client-rendered). Gives deep links but no server
  HTML, so no-JS and SEO stay broken. Rejected.
- **Separate document pages for no-JS, desktop for JS** (what #31
  started). Two implementations of every app's content, and a
  layout shift when the desktop takes over. Rejected in favour of
  one server-rendered desktop.
- **Keep `svelte/store` and just split the Desktop.** Stores work,
  but singletons can't be scoped or reset per test, and mirroring
  them into `$state` is the churn this removes.

## Consequences

- **Bundle.** Every page that shows the desktop hydrates the shell
  (~ the same JS as `/` today). App code stays lazy; an app route
  also loads its own app's chunk to hydrate. The JS budget in
  `docs/05` still applies to `/`; `pnpm size` checks it.
- **SEO and no-JS.** Every app's content is real HTML at a stable
  URL, with its own title, description and canonical. Crawlers and
  readers without JavaScript get the whole site.
- **LCP.** The largest element is server-rendered, so it no longer
  waits for hydration; the mobile LCP gate returns to 2.5 s.
- **Hydration mismatches** become possible (server vs client
  markup), so anything that depends on the viewport, the time or
  storage must render the same on both sides and update after
  mount, or live in CSS.
- **Boot.** The boot sequence is an overlay over the
  server-rendered desktop, started by the inline bootstrap script
  only when it should play; it never hides content from no-JS
  visitors.
- **Testing.** Kernel classes are plain TypeScript with runes and
  test without a DOM tree. The e2e suite shrinks to the flows that
  matter (boot and skip, windows, keyboard, deep links and history,
  mobile, an axe pass) on one engine by default.
- **Migration** happens issue by issue behind the e2e suite (epic
  #70): kernel first, then app modules, then routes and server
  rendering, then content, styling and hardening. Each step ships
  on its own.
