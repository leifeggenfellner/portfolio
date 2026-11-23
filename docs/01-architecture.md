# 01 — System architecture

The target and its reasons are in
[ADR 0006](./adrs/0006-route-first-os-kernel.md). This page describes
the system as built. Inventories that come from code (apps, routes,
settings, shortcuts) are generated into [inventory.md](./inventory.md)
and [keyboard.md](./keyboard.md); CI fails if they are stale.

## Route-first

Every app has a URL, and every URL is server-rendered HTML:

- `/` is the desktop with no window open.
- `/about/`, `/terminal/`, `/projects/retro-os/`, … are the desktop
  with that app's window open and its real content in the HTML. They
  are generated from the app manifests by `src/pages/[...app].astro`.
- `/posts/` and its posts are plain documents (`DocumentLayout`), zero JS.

Without JavaScript the site is fully readable: desktop icons are links
to app pages, and an app page shows its window. With JavaScript, one
island (`shell/Os.svelte`, hydrated by the `client:desktop` directive)
takes over: links open windows in place, the URL follows the active
window, and Back closes the window its history entry opened.

On an app page, the app's component renders on the server
(`src/apps/server.ts`) and its chunk loads before hydration
(`src/apps/preload.ts` + `src/directives/desktop.ts`), so the window
hydrates with the same content.

## Layers

Imports only go down this list. ESLint enforces it (`eslint.config.js`)
for `.ts`, `.svelte` and `.astro`.

```
pages/, layouts/        Astro routes and layouts
components/shell/       the desktop: icons, window layer, taskbar, menus, palette
apps/<id>/              one folder per app: manifest, App.svelte, logic
components/effects/     boot, splash, wallpaper scene, CRT, screensaver
components/primitives/  window, title bar, button, menu, icon
lib/os/                 the kernel (rune classes) and its context
lib/                    pure logic: settings schema, palette, bounds, motion, …
content/                collections, schemas, the virtual:content plugin
styles/                 tokens → theme bridge → chrome → effects, cursors
```

Apps never import other apps or the shell; they get an `AppShell` prop
(open another app, close themselves) and kernel services via `getOs()`.

## The kernel (`src/lib/os/`)

Rune classes created together by `createOs()` and provided through
Svelte context from the island root; components call `getOs()`, tests
build their own with `createOs()` / `osContext()`.

| Service           | Owns                                                                 |
| ----------------- | -------------------------------------------------------------------- |
| `WindowManager`   | open windows, stacking, active window, layout (floating, snapped,    |
|                   | maximised), focus memory, announcements                              |
| `Launcher`        | opening apps with typed `args`, loading app code, window origins     |
| `Navigation`      | windows ↔ URLs: push on open, replace on focus or close, Back closes |
| `Keymap`          | every shortcut, in scopes: modal > window > desktop > global         |
| `SettingsService` | schema-driven settings, persisted, applied to `<html>`               |
| `Boot`            | the boot phase machine, an overlay over the server-rendered desktop  |
| `Viewport`        | size, taskbar height, phone, coarse pointer, reduced motion          |
| `Announcer`       | the one polite live region                                           |

## Apps (`src/apps/<id>/`)

```
manifest.ts   id, order, title, description, icon, route, subpath args,
              default geometry, palette commands, parseArgs, load()
App.svelte    the content, in a window and on the app's page
logic.ts …    pure logic, unit-tested where it has real logic
```

`src/apps/registry.ts` globs the manifests. The desktop icons, Start
menu, palette, terminal `open`, pages and inventory all come from it;
nothing else lists apps. See the `generate-app` skill.

## Content

Profile, skills, projects and posts are content collections validated
by the zod schemas in `src/content/schema.ts`. Pages read collections;
the browser gets the same files through `virtual:content/*` modules
(`src/content/vite-plugin.ts`), validated with the same schemas, and
each dataset ships only in the chunks that import it.

## Focus model

- The active window is the top-most one that isn't minimised; closing or
  minimising hands it to the window below.
- Focus follows the active window: on activation it goes to the element
  last focused in its body, else its `data-autofocus` field, else the
  window frame. With no window left, focus goes to the taskbar.
- A click on a title bar passes focus on to where the window was working.
- Modal layers (screensaver, boot, terminal toys) take every key through
  the keymap; the palette returns focus to where it was opened from.

## Motion

Enter and exit transitions go through `motion()` (`src/lib/motion.ts`):
durations from tokens, nothing under reduced motion, and a guaranteed
end even when frames are starved. The boot splash is removed on a timer
for the same reason.

## Error boundaries

- Every window's content sits in its own `<svelte:boundary>`
  (`shell/AppFrame.svelte`). An error while an app renders or runs an
  effect swaps the app for a blue screen (`shell/AppCrash.svelte`)
  inside the same window chrome, with "Restart app" and "Close". Other
  windows, the taskbar and the Start menu keep working.
- Errors in event handlers and async callbacks are not caught by
  boundaries (a Svelte rule), so apps keep those paths simple.
- A failed app import is logged by the Launcher; the window doesn't open.
- The Terminal's hidden `panic` command crashes it on purpose; the e2e
  suite uses it to exercise the boundary.
