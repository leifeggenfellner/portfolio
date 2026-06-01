/* ============================================================
   RetroOS — ReadMe / Design-System document.
   The written "senior staff eng + product designer" doc,
   presented as a tabbed window inside the OS.
   ============================================================ */

const { useState } = React;

function DocH({ children }) {
  return (
    <h3 className="chrome" style={{ margin: "0 0 6px", fontSize: 18 }}>
      {children}
    </h3>
  );
}
function DocP({ children }) {
  return (
    <p style={{ margin: "0 0 12px", fontSize: 13.5, lineHeight: 1.55, color: "var(--text)", textWrap: "pretty" }}>
      {children}
    </p>
  );
}
function Code({ children }) {
  return (
    <pre
      className="mono retro-scroll bevel-in"
      style={{
        margin: "0 0 14px",
        padding: "10px 12px",
        background: "var(--surface-3)",
        fontSize: 14,
        lineHeight: 1.5,
        overflow: "auto",
        color: "var(--text)",
      }}
    >
      {children}
    </pre>
  );
}
function Pill({ children }) {
  return (
    <span
      className="bevel-out-thin"
      style={{
        padding: "1px 7px",
        background: "var(--surface)",
        fontSize: 12,
        marginRight: 5,
        display: "inline-block",
        marginBottom: 4,
      }}
    >
      {children}
    </span>
  );
}

function ReadmeDoc() {
  const [tab, setTab] = useState("overview");
  return (
    <Tabs
      value={tab}
      onChange={setTab}
      tabs={[
        { id: "overview", label: "Overview", content: <DocOverview /> },
        { id: "tokens", label: "Tokens", content: <DocTokens /> },
        { id: "arch", label: "Architecture", content: <DocArch /> },
        { id: "api", label: "API", content: <DocApi /> },
        { id: "a11y", label: "A11y + Theming", content: <DocA11y /> },
        { id: "roadmap", label: "Roadmap", content: <DocRoadmap /> },
      ]}
    />
  );
}

function DocOverview() {
  return (
    <div>
      <DocH>RetroOS — a retro-desktop portfolio kit</DocH>
      <DocP>
        A component system for personal sites that feels like a booted 90s/2000s desktop environment without cloning any
        one OS. The brief: nostalgic, never gimmicky — pixel-perfect chrome, draggable windows, CRT accents, chunky
        bevels, all on a clean, tree-shakeable, strongly-typed foundation.
      </DocP>
      <DocP>
        The split that keeps it maintainable: <b>primitives</b> (content-free, presentational, variant-driven) sit
        underneath <b>composed apps</b> (the portfolio content — projects, about, terminal). A small{" "}
        <b>window manager</b> owns runtime state. Everything reads from <b>design tokens</b>; no component hard-codes a
        color.
      </DocP>
      <DocH>Design direction</DocH>
      <DocP>
        Two themes from one token set: <b>vaporwave "day"</b> (dusk-lavender beveled chrome, signature magenta→cyan
        title bars) and <b>neon "night" CRT</b> (near-black indigo surfaces, neon glow). A swappable accent pair drives
        selection, meters and highlights. Type: <Pill>Pixelify Sans — chrome</Pill> <Pill>VT323 — terminal/mono</Pill>{" "}
        <Pill>Hanken Grotesk — body</Pill>. Shadows are hard offsets in light, soft glow in dark. Borders are 2px
        multi-edge bevels, 0 radius.
      </DocP>
      <DocH>What's in the box</DocH>
      <DocP>
        <b>Primitives:</b> <Pill>RetroButton</Pill>
        <Pill>RetroCard</Pill>
        <Pill>GroupBox</Pill>
        <Pill>WindowHeader</Pill>
        <Pill>RetroWindow</Pill>
        <Pill>Tabs</Pill>
        <Pill>Tooltip</Pill>
        <Pill>ContextMenu</Pill>
        <Pill>Modal</Pill>
        <Pill>DesktopIcon</Pill>
        <Pill>ProgressBar</Pill>
      </DocP>
      <DocP>
        <b>Composed:</b> <Pill>HeroSection</Pill>
        <Pill>AboutSection</Pill>
        <Pill>ProjectWindow</Pill>
        <Pill>SkillsMatrix</Pill>
        <Pill>FileExplorer</Pill>
        <Pill>TerminalPanel</Pill>
        <Pill>ContactTerminal</Pill>
        <Pill>Taskbar</Pill>
        <Pill>StartMenu</Pill>
        <Pill>Dock</Pill>
        <Pill>CommandPalette</Pill>
      </DocP>
      <DocP style={{ color: "var(--text-dim)" }}>
        This window, the taskbar, every draggable frame you see — all rendered from this kit. The desktop <i>is</i> the
        demo.
      </DocP>
    </div>
  );
}

function DocTokens() {
  return (
    <div>
      <DocH>Three-tier token pipeline</DocH>
      <DocP>
        Global primitives → semantic aliases → component tokens. Components only ever touch the semantic layer, so
        re-theming is a single alias swap and never a component edit.
      </DocP>
      <Code>{`/* tier 1 — global */      --c-lav-300: #cfc7e6;
/* tier 2 — semantic */    --surface: var(--c-lav-300);
                          --bevel-light: #fdfaff;
                          --bevel-dark: #4a3d6b;
/* tier 3 — component */   button { background: var(--surface); }`}</Code>
      <DocH>Theming = data-attribute swap</DocH>
      <DocP>
        The semantic layer is redefined under <code className="mono">[data-theme="dark"]</code>. Flip one attribute on
        the root and the whole tree retones — no React re-mount, no prop drilling.
      </DocP>
      <Code>{`:root, [data-theme="light"] { --surface:#cfc7e6; --text:#281a47; }
[data-theme="dark"]         { --surface:#221a38; --text:#e6d9ff; }`}</Code>
      <DocH>The bevel primitive</DocH>
      <DocP>
        The entire retro look is two utility classes built from four bevel tokens. Raised and sunk are mirror images;
        "pressed" just swaps the raised edges.
      </DocP>
      <Code>{`.bevel-out { border-color: var(--bevel-light) var(--bevel-dark)
                          var(--bevel-dark)  var(--bevel-light); }
.bevel-in  { border-color: var(--bevel-dark)  var(--bevel-light)
                          var(--bevel-light) var(--bevel-dark); }`}</Code>
      <DocP>
        Scales: spacing on a 4px base (<code className="mono">--sp-1…7</code>), z-layers are named (
        <code className="mono">--z-window</code> … <code className="mono">--z-modal</code>) so stacking is declarative,
        never magic numbers.
      </DocP>
    </div>
  );
}

function DocArch() {
  return (
    <div>
      <DocH>Folder structure</DocH>
      <Code>{`src/
├─ tokens/            # css vars + (optional) TS token export
│   ├─ tokens.css
│   └─ themes.ts
├─ primitives/        # content-free, presentational
│   ├─ RetroButton/   # index.tsx · variants.ts · types.ts
│   ├─ RetroWindow/   # Window.tsx · WindowHeader.tsx (compound)
│   ├─ Tabs/  Tooltip/  ContextMenu/  Modal/  …
│   └─ index.ts       # barrel — tree-shakeable re-exports
├─ system/            # runtime behaviour
│   ├─ WindowManager.tsx   # context + reducer
│   ├─ useWindow.ts        # per-window hook
│   └─ useHotkeys.ts
├─ composed/          # the portfolio layer
│   ├─ HeroSection/  ProjectWindow/  FileExplorer/
│   ├─ TerminalPanel/  SkillsMatrix/  ContactTerminal/
│   └─ shell/  → Taskbar · StartMenu · Dock · CommandPalette
├─ content/           # portfolio DATA (projects, persona)
└─ index.ts`}</Code>
      <DocH>State management</DocH>
      <DocP>
        One <code className="mono">WindowManager</code> context holds the only real app state: open windows, z-order,
        focus, minimized/maximized, and positions. A reducer handles{" "}
        <code className="mono">OPEN · CLOSE · FOCUS · MOVE · MINIMIZE · MAXIMIZE</code>. Components stay dumb — they
        read their slice via <code className="mono">useWindow(id)</code> and dispatch intents. No global store library
        needed.
      </DocP>
      <Code>{`const [state, dispatch] = useReducer(wmReducer, initial);
dispatch({ type: "OPEN", app: "terminal" });
dispatch({ type: "FOCUS", id });   // bumps z-order
dispatch({ type: "MOVE", id, x, y });`}</Code>
      <DocH>Animation strategy</DocH>
      <DocP>
        CSS-first, GPU-cheap: <code className="mono">transform/opacity</code> keyframes for window open/minimize, dock
        bounce, menu pop-in. The terminal caret and CRT flicker are pure CSS. A motion layer (Framer Motion) is opt-in
        for spring drag — but the kit works fully without it. Everything respects{" "}
        <code className="mono">prefers-reduced-motion</code>.
      </DocP>
    </div>
  );
}

function DocApi() {
  return (
    <div>
      <DocH>API design — composition over prop bloat</DocH>
      <DocP>
        Variants are data, not booleans. Compound components expose structure. Windows are composed, never configured by
        a 20-prop object.
      </DocP>
      <Code>{`<RetroButton variant="primary" size="lg">Transmit</RetroButton>

<RetroWindow title="Terminal" icon="🖥️">
  <RetroWindow.Header onClose={close} onMinimize={min} />
  <RetroWindow.Body><TerminalPanel /></RetroWindow.Body>
  <RetroWindow.Status>Ready · 24 lines</RetroWindow.Status>
</RetroWindow>

<ContextMenu items={[
  { label: "Open", icon: "↗", onClick },
  { sep: true },
  { label: "Properties", kbd: "Alt+↵", disabled: true },
]} />`}</Code>
      <DocH>Example: HeroSection composition</DocH>
      <DocP>
        The hero is just the window manager seeded with a few open windows over a wallpaper, with a boot sequence in
        front.
      </DocP>
      <Code>{`<HeroSection
  wallpaper="grid"
  boot          // skippable POST animation
  crt="subtle"
  initial={["hero", "terminal", "projects"]}
>
  <WindowManagerProvider>
    <Desktop />     {/* icons + drag layer        */}
    <Dock />        {/* quick launch              */}
    <Taskbar />     {/* start + running + tray    */}
  </WindowManagerProvider>
</HeroSection>`}</Code>
      <DocP>
        Strong typing: <code className="mono">type AppId = keyof typeof APP_REGISTRY</code> means open/launch calls are
        checked at compile time and the command palette is generated from the same registry.
      </DocP>
    </div>
  );
}

function DocA11y() {
  return (
    <div>
      <DocH>Accessibility</DocH>
      <DocP>Retro doesn't mean inaccessible. Real semantics under the pixels:</DocP>
      <ul style={{ margin: "0 0 12px", paddingLeft: 18, fontSize: 13.5, lineHeight: 1.6 }}>
        <li>
          Windows are <code className="mono">role="dialog"</code>; menus <code className="mono">role="menu"</code>; tabs
          a proper <code className="mono">tablist</code> with roving tabindex + arrow keys.
        </li>
        <li>
          Every control is a real <code className="mono">&lt;button&gt;</code>/
          <code className="mono">&lt;input&gt;</code> — keyboard-operable, with a period-correct dotted focus ring
          (never <code className="mono">outline:none</code> with no replacement).
        </li>
        <li>
          <code className="mono">Esc</code> closes menus/modals/palette; <code className="mono">⌘K</code> opens Run;
          arrow keys drive the palette.
        </li>
        <li>
          Color is never the only signal; contrast targets WCAG AA in both themes; full{" "}
          <code className="mono">prefers-reduced-motion</code> support.
        </li>
        <li>
          The CRT layer is decorative — <code className="mono">pointer-events:none</code>, behind nothing focusable, and
          disable-able.
        </li>
      </ul>
      <DocH>Theming strategy</DocH>
      <DocP>
        Themes are token sets, not forks. Ship light + dark CRT today; an accent-hue token lets users restyle title bars
        and meters without touching components. A theme is ~30 CSS custom properties — community themes are a single
        file.
      </DocP>
      <DocH>Mobile adaptation</DocH>
      <DocP>
        Desktop metaphors degrade gracefully. Below ~720px the WM switches from free-drag windows to a single
        full-screen "app" stack; the taskbar becomes a bottom app-switcher; the dock collapses into the Start menu;
        drag-resize is disabled in favour of full-bleed. The same components render — only the WM's layout policy
        changes.
      </DocP>
      <Code>{`if (viewport < 720) wm.mode = "stack";   // one window, full-bleed
else                 wm.mode = "float";   // free desktop`}</Code>
    </div>
  );
}

function DocRoadmap() {
  const phases = [
    ["Phase 1 — Foundation", "Tokens, bevel utilities, RetroButton/Card/Window, WindowManager, two themes.", "done"],
    ["Phase 2 — Shell", "Taskbar, StartMenu, Dock, CommandPalette, ContextMenu, Tooltip, Modal.", "done"],
    ["Phase 3 — Portfolio apps", "HeroSection, ProjectWindow, FileExplorer, Terminal, SkillsMatrix, Contact.", "done"],
    ["Phase 4 — Polish", "Boot sequence, CRT layer, sound (opt-in), reduced-motion pass, mobile stack mode.", "active"],
    ["Phase 5 — Ship", "TS types + barrel exports, Storybook, a11y audit, npm publish, docs site.", "next"],
  ];
  return (
    <div>
      <DocH>Implementation roadmap</DocH>
      <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
        {phases.map(([t, d, s]) => (
          <div
            key={t}
            className="bevel-out-thin"
            style={{
              display: "grid",
              gridTemplateColumns: "16px 1fr",
              gap: 10,
              padding: "9px 11px",
              background: "var(--surface)",
            }}
          >
            <span
              style={{
                fontSize: 15,
                color: s === "done" ? "var(--ok)" : s === "active" ? "var(--accent-2)" : "var(--text-disabled)",
              }}
            >
              {s === "done" ? "☑" : s === "active" ? "▸" : "☐"}
            </span>
            <div>
              <div className="chrome" style={{ fontSize: 15 }}>
                {t}
              </div>
              <div style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.45 }}>{d}</div>
            </div>
          </div>
        ))}
      </div>
      <DocH>Future extensibility</DocH>
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, lineHeight: 1.65 }}>
        <li>
          <b>Theme marketplace</b> — vaporwave, amber terminal, classic platinum as drop-in token files.
        </li>
        <li>
          <b>Window plugins</b> — a registry API so a blog, photo viewer, or guestbook are just new app ids.
        </li>
        <li>
          <b>Persisted desktop</b> — window positions + open apps saved to localStorage, deep-linkable via URL.
        </li>
        <li>
          <b>Opt-in sound</b> — bleeps for open/close/error, muted by default and behind a toggle.
        </li>
        <li>
          <b>SSR + headless</b> — primitives stay framework-light so the kit can target Next.js or Astro.
        </li>
      </ul>
    </div>
  );
}

Object.assign(window, { ReadmeDoc });
