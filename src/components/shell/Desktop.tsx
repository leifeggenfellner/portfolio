/**
 * Desktop — top-level shell. Composes:
 *  - Wallpaper (purely visual)
 *  - DesktopIcons grid (opens windows)
 *  - WindowManager (renders zustand-tracked RetroWindows)
 *  - Taskbar / Dock / StartMenu (out of scope of this stub)
 *  - CrtLayer (always on top, inert)
 *  - BootSequence on first visit
 *
 * Mobile: when `(max-width: 768px)` matches we collapse to
 * a single fullscreen window + bottom dock (no dragging).
 */
import { Suspense, useEffect, useState } from "react";
import { APPS } from "@apps/registry";
import { BootSequence } from "@effects/BootSequence";
import { CrtLayer } from "@effects/CrtLayer";
import { Wallpaper } from "@effects/Wallpaper";
import { useMediaQuery } from "@lib/hooks/use-media-query";
import { useWindowManager } from "@lib/store/window-manager";
import { RetroWindow } from "@primitives/RetroWindow";

export function Desktop() {
  const [booted, setBooted] = useState(true);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { windows, activeId, open, close, focus, move, resize, minimize, toggleMax } =
    useWindowManager();

  useEffect(() => {
    try {
      const seen = sessionStorage.getItem("retro:booted") === "1";
      const force = new URLSearchParams(location.search).get("boot") === "1";
      setBooted(seen && !force);
    } catch {
      setBooted(false);
    }
  }, []);

  const launch = (appId: string) => {
    const app = APPS.find((a) => a.id === appId);
    if (!app) return;
    open({
      id: app.id,
      appId: app.id,
      title: app.title,
      icon: app.icon,
      ...app.defaults,
    });
  };

  return (
    <main
      className="relative h-screen w-screen overflow-hidden"
      style={{ background: "var(--desktop-bg)" }}
    >
      <Wallpaper />

      {/* Desktop icon grid — top-left, vertical column. */}
      <ul className="absolute top-4 left-4 z-[var(--z-desktop)] flex flex-col gap-3">
        {APPS.map((a) => (
          <li key={a.id}>
            <button
              type="button"
              onDoubleClick={() => launch(a.id)}
              onClick={() => isMobile && launch(a.id)}
              className="focus-ring flex w-[76px] flex-col items-center gap-1 p-1 text-12 text-white"
              style={{ textShadow: "1px 1px 0 rgba(0,0,0,.7)" }}
            >
              <span className="text-[30px] leading-none">{a.icon}</span>
              <span>{a.title.split(" ")[0]}</span>
            </button>
          </li>
        ))}
      </ul>

      {/* Window manager */}
      <Suspense fallback={null}>
        {windows.map((w) => {
          const App = APPS.find((a) => a.id === w.appId)?.render;
          if (!App) return null;
          const geom = isMobile
            ? { x: 0, y: 0, w: window.innerWidth, h: window.innerHeight - 56, maximized: true }
            : { x: w.x, y: w.y, w: w.w, h: w.h, maximized: w.maximized };
          return (
            <RetroWindow
              key={w.id}
              title={w.title}
              icon={w.icon}
              active={activeId === w.id}
              z={w.z}
              minimized={w.minimized}
              {...geom}
              onFocus={() => focus(w.id)}
              onMove={(x, y) => move(w.id, x, y)}
              onResize={(ww, hh) => resize(w.id, ww, hh)}
              onMin={() => minimize(w.id)}
              onMax={() => toggleMax(w.id)}
              onClose={() => close(w.id)}
              resizable={!isMobile}
            >
              <App />
            </RetroWindow>
          );
        })}
      </Suspense>

      {/* TODO: Taskbar / Dock / StartMenu / CommandPalette */}

      <CrtLayer />
      {!booted && <BootSequence onDone={() => setBooted(true)} />}
    </main>
  );
}
