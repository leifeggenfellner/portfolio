# Inventory

<!-- Generated from the app manifests, content and settings schema by `pnpm docs:generate`. Do not edit. -->

What the site is made of, from the code that defines it.

## Apps (7)

One folder each in `src/apps/`, in desktop order.

| App              | Id         | Page                       |
| ---------------- | ---------- | -------------------------- |
| Me.txt — Notepad | `about`    | `/about/`                  |
| Projects         | `projects` | `/projects/` (+ sub-pages) |
| Terminal         | `terminal` | `/terminal/`               |
| Skills Matrix    | `skills`   | `/skills/`                 |
| Contact          | `contact`  | `/contact/`                |
| Minesweeper      | `minigame` | `/minesweeper/`            |
| Settings         | `settings` | `/settings/`               |

## Pages

Every page is server-rendered; app pages are the desktop with that window open.

- `/` — the desktop
- `/about/` — Me.txt — Notepad
- `/projects/` — Projects
- `/terminal/` — Terminal
- `/skills/` — Skills Matrix
- `/contact/` — Contact
- `/minesweeper/` — Minesweeper
- `/settings/` — Settings
- `/projects/a-star/` — Projects, at that project
- `/projects/advent-of-code/` — Projects, at that project
- `/projects/dotfiles/` — Projects, at that project
- `/projects/project-euler/` — Projects, at that project
- `/projects/retro-os/` — Projects, at that project
- `/projects/sorting-visualizer/` — Projects, at that project
- `/projects/tsi-apparel/` — Projects, at that project
- `/posts/` and each published post — documents
- `/rss.xml`, `/sitemap-index.xml`, `/robots.txt`

## Settings (7)

From `SETTINGS_SCHEMA` in `src/lib/settings.ts`.

| Key             | Label               | Values                     | Default | On `<html>`       |
| --------------- | ------------------- | -------------------------- | ------- | ----------------- |
| `bootAnimation` | Play boot animation | on, off                    | on      | —                 |
| `theme`         | Theme               | light, dark                | light   | `data-theme`      |
| `cursors`       | Pixel-art cursors   | retro, system              | retro   | `data-cursors`    |
| `crt`           | CRT effect          | off, subtle, full          | subtle  | `data-crt`        |
| `gridSpeed`     | Grid speed          | paused, slow, normal, fast | normal  | `data-grid-speed` |
| `iconSize`      | Icon size           | small, medium, large       | medium  | `data-icon-size`  |
| `screensaver`   | Screensaver         | never, 1, 3, 10            | 3       | —                 |

## Shortcuts

See [keyboard.md](./keyboard.md).
