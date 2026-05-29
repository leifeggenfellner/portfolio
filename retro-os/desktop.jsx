/* ============================================================
   RetroOS — Desktop composition + Window Manager + Boot + App
   Ties primitives, apps, shell and doc together into the
   live HeroSection desktop. Tweaks: theme / CRT / accent / grid.
   ============================================================ */

const { useState, useRef, useEffect, useCallback } = React;

/* ---------- Window Manager hook (the only real app state) ---------- */
let _seq = 1;
function useWindowManager() {
  const [wins, setWins] = useState([]);
  const [topZ, setTopZ] = useState(100);

  const focus = useCallback((id) => {
    setTopZ((z) => {
      const nz = z + 1;
      setWins((ws) => ws.map((w) => w.id === id ? { ...w, z: nz, minimized: false } : w));
      return nz;
    });
  }, []);

  const open = useCallback((app, payload) => {
    setWins((ws) => {
      // single-instance for non-project apps; projects keyed by payload
      const key = app === "project" ? `project:${payload}` : app;
      const existing = ws.find((w) => w.key === key);
      const nz = topZ + 1;
      if (existing) {
        return ws.map((w) => w.key === key ? { ...w, z: nz, minimized: false } : w);
      }
      const meta = app === "project"
        ? (() => { const p = PROJECTS.find((x) => x.id === payload); return { title: `${p.name} — ${p.kind}`, icon: p.icon, w: 460, h: 440 }; })()
        : APP_REGISTRY[app];
      const count = ws.length;
      const cx0 = Math.round(window.innerWidth / 2 - meta.w / 2);
      const cy0 = Math.round(window.innerHeight / 2 - meta.h / 2 - 30);
      const off = (count % 6) * 26;
      return [...ws, {
        id: _seq++, key, app, payload, title: meta.title, icon: meta.icon,
        x: Math.max(8, cx0 + off - 60), y: Math.max(8, cy0 + off - 40),
        w: meta.w, h: meta.h, z: nz, minimized: false, maximized: false,
      }];
    });
    setTopZ((z) => z + 1);
  }, [topZ]);

  const close = useCallback((id) => setWins((ws) => ws.filter((w) => w.id !== id)), []);
  const move = useCallback((id, x, y) => setWins((ws) => ws.map((w) => w.id === id ? { ...w, x, y } : w)), []);
  const resize = useCallback((id, w, h) => setWins((ws) => ws.map((x) => x.id === id ? { ...x, w, h } : x)), []);
  const minimize = useCallback((id) => setWins((ws) => ws.map((w) => w.id === id ? { ...w, minimized: true } : w)), []);
  const toggleMax = useCallback((id) => setWins((ws) => ws.map((w) => w.id === id ? { ...w, maximized: !w.maximized } : w)), []);

  const activeId = wins.reduce((a, w) => (!w.minimized && (!a || w.z > a.z) ? w : a), null)?.id;
  return { wins, activeId, open, close, focus, move, resize, minimize, toggleMax };
}

/* ---------- Window content router ---------- */
function WindowContent({ win, wm, onTheme }) {
  switch (win.app) {
    case "hero": return <WelcomeWindow onLaunch={wm.open} />;
    case "about": return <AboutSection />;
    case "skills": return <SkillsMatrix />;
    case "contact": return <ContactTerminal />;
    case "terminal": return <TerminalPanel onLaunch={wm.open} onTheme={onTheme} />;
    case "files": return <FileExplorer onLaunch={wm.open} />;
    case "projects": return <FileExplorer onLaunch={wm.open} initialPath="Projects" />;
    case "readme": return <ReadmeDoc />;
    case "resume": return <ResumeView />;
    case "project": return <ProjectView project={PROJECTS.find((p) => p.id === win.payload)} />;
    default: return <div style={{ padding: 16 }}>Unknown app.</div>;
  }
}
function statusFor(win) {
  switch (win.app) {
    case "files": case "projects": return ["⛁ C: drive", "Ready"];
    case "terminal": return ["● connected", "retro-sh 5.0"];
    case "readme": return ["📖 v1.0.95", "6 sections"];
    default: return null;
  }
}

/* ============================================================
   WelcomeWindow — the primary active window in the hero
   ============================================================ */
function WelcomeWindow({ onLaunch }) {
  return (
    <div style={{ padding: 0, display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "18px 20px 14px", background: "linear-gradient(120deg, var(--magenta), var(--cyan))", color: "#fff" }}>
        <div className="mono" style={{ fontSize: 14, opacity: 0.9, marginBottom: 2 }}>{">"} booting portfolio.exe …</div>
        <h1 className="chrome" style={{ margin: 0, fontSize: 30, textShadow: "2px 2px 0 rgba(0,0,0,0.3)" }}>{PERSONA.name}</h1>
        <div style={{ fontSize: 16, fontWeight: 600 }}>{PERSONA.role} · {PERSONA.location}</div>
      </div>
      <div style={{ padding: "16px 20px", display: "grid", gap: 14, flex: 1 }}>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, textWrap: "pretty" }}>{PERSONA.blurb}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <RetroButton variant="primary" onClick={() => onLaunch("projects")}>🗂️ View Projects</RetroButton>
          <RetroButton onClick={() => onLaunch("about")}>👤 About Me</RetroButton>
          <RetroButton onClick={() => onLaunch("terminal")}>🖥️ Terminal</RetroButton>
          <RetroButton onClick={() => onLaunch("contact")}>✉️ Contact</RetroButton>
        </div>
        <div className="bevel-in-thin mono" style={{ marginTop: "auto", padding: "6px 10px", fontSize: 13, color: "var(--text-dim)", background: "var(--surface-3)" }}>
          tip: double-click desktop icons · press <b>⌘K</b> for the command palette · open the <b>Design System</b> doc from Start
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   ResumeView — a "printed" résumé inside a pdf window
   ============================================================ */
function ResumeView() {
  return (
    <div className="retro-scroll" style={{ overflow: "auto", height: "100%", background: "#4a3d6b", padding: 14 }}>
      <div style={{ background: "#fff", color: "#1a1a1a", padding: "28px 30px", fontFamily: "var(--font-body)", boxShadow: "0 2px 8px rgba(0,0,0,0.4)", maxWidth: 460, margin: "0 auto" }}>
        <h2 style={{ margin: 0, fontSize: 24, fontFamily: "var(--font-chrome)" }}>{PERSONA.name}</h2>
        <div style={{ fontSize: 14, color: "#666", marginBottom: 14, borderBottom: "2px solid #1a1a1a", paddingBottom: 8 }}>
          {PERSONA.role} · {PERSONA.location} · {PERSONA.email}
        </div>
        <ResSec title="Summary"><p style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>{PERSONA.blurb}</p></ResSec>
        <ResSec title="Selected Work">
          {PROJECTS.map((p) => (
            <div key={p.id} style={{ marginBottom: 9 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5 }}>
                <b>{p.name} — {p.kind}</b><span style={{ color: "#888" }}>{p.year}</span>
              </div>
              <div style={{ fontSize: 12.5, color: "#444", lineHeight: 1.45 }}>{p.summary}</div>
            </div>
          ))}
        </ResSec>
        <ResSec title="Skills">
          <div style={{ fontSize: 12.5, lineHeight: 1.7 }}>
            {SKILLS.map((g) => <div key={g.group}><b>{g.group}:</b> {g.items.map((i) => i[0]).join(", ")}</div>)}
          </div>
        </ResSec>
      </div>
    </div>
  );
}
function ResSec({ title, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase", color: "#b5327e", fontWeight: 700, marginBottom: 6 }}>{title}</div>
      {children}
    </div>
  );
}

/* ============================================================
   Boot sequence — POST text, then fade to desktop
   ============================================================ */
const BOOT_LINES = [
  { t: "RetroOS BIOS v1.0.95 — VaporBoot", d: 90 },
  { t: "Copyright (c) " + PERSONA.name, d: 60 },
  { t: "", d: 30 },
  { t: "CPU ........ NeonCore 486DX @ 66MHz   [OK]", d: 110 },
  { t: "Memory ..... 64MB EDO RAM .............. [OK]", d: 130 },
  { t: "Display .... S3 ViRGE / CRT ............ [OK]", d: 110 },
  { t: "Audio ...... SoundWave 16-bit .......... [OK]", d: 90 },
  { t: "Network .... 56k handshake ............. [OK]", d: 150 },
  { t: "", d: 30 },
  { t: "Mounting C:\\ portfolio ...", d: 120 },
  { t: "Loading window manager (BevelWM) ...", d: 130 },
  { t: "Starting desktop environment ...", d: 160 },
  { t: "", d: 40 },
  { t: "Welcome, " + PERSONA.handle, d: 120, accent: true },
];
function BootScreen({ onDone }) {
  const [shown, setShown] = useState(0);
  const [fading, setFading] = useState(false);
  useEffect(() => {
    if (shown >= BOOT_LINES.length) {
      const t = setTimeout(() => { setFading(true); setTimeout(onDone, 500); }, 420);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setShown((s) => s + 1), BOOT_LINES[shown].d);
    return () => clearTimeout(t);
  }, [shown, onDone]);
  return (
    <div onClick={onDone} title="click to skip"
      style={{ position: "fixed", inset: 0, zIndex: "var(--z-boot)", background: "#06030f", color: "#36e0e0",
        fontFamily: "var(--font-mono)", fontSize: 19, padding: "40px 48px", cursor: "pointer",
        opacity: fading ? 0 : 1, transition: "opacity 0.5s", textShadow: "0 0 8px rgba(54,224,224,0.5)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
        <div style={{ width: 34, height: 34, border: "3px solid #ff5fd2", borderTopColor: "transparent", borderRadius: "50%", animation: "spin-slow 1s linear infinite" }} />
        <span className="chrome" style={{ fontSize: 26, color: "#ff5fd2", textShadow: "0 0 12px rgba(255,95,210,0.6)" }}>RetroOS</span>
      </div>
      {BOOT_LINES.slice(0, shown).map((l, i) => (
        <div key={i} style={{ color: l.accent ? "#ff5fd2" : "#36e0e0", minHeight: 26, whiteSpace: "pre-wrap" }}>{l.t}</div>
      ))}
      {shown < BOOT_LINES.length && <span style={{ animation: "boot-cursor 0.7s steps(1) infinite" }}>█</span>}
      <div className="mono" style={{ position: "absolute", bottom: 22, left: 48, fontSize: 14, color: "#6a5a92" }}>click anywhere to skip ▸</div>
    </div>
  );
}

/* ============================================================
   CRT overlay layer
   ============================================================ */
function CRTLayer() {
  return (
    <div className="crt-layer" aria-hidden="true">
      <div className="crt-scanlines" />
      <div className="crt-vignette" />
      <div className="crt-glow" />
      <div className="crt-noise" />
    </div>
  );
}

/* ============================================================
   Desktop icons layer
   ============================================================ */
const DESK_ICONS = [
  { id: "hero", icon: "✨", label: "Welcome" },
  { id: "projects", icon: "🗂️", label: "My Projects" },
  { id: "about", icon: "👤", label: "About Me" },
  { id: "files", icon: "📁", label: "File Explorer" },
  { id: "terminal", icon: "🖥️", label: "Terminal" },
  { id: "readme", icon: "📖", label: "Design System" },
  { id: "contact", icon: "✉️", label: "Contact" },
];
function DesktopIcons({ onLaunch, openMenu }) {
  const [sel, setSel] = useState(null);
  return (
    <div onPointerDown={() => setSel(null)}
      style={{ position: "absolute", top: 16, left: 12, display: "flex", flexDirection: "column", flexWrap: "wrap",
        gap: 6, height: "calc(100% - 120px)", alignContent: "flex-start" }}>
      {DESK_ICONS.map((d) => (
        <DesktopIcon key={d.id} icon={d.icon} label={d.label} selected={sel === d.id}
          onSelect={() => setSel(d.id)} onOpen={() => onLaunch(d.id)}
          onContextMenu={(e) => { setSel(d.id); openMenu(e, [
            { label: "Open", icon: "↗", onClick: () => onLaunch(d.id) },
            { sep: true },
            { label: "Create shortcut", icon: "⤵", disabled: true },
            { label: "Properties", icon: "ⓘ", disabled: true, kbd: "Alt+↵" },
          ]); }} />
      ))}
    </div>
  );
}

/* ============================================================
   TWEAKS
   ============================================================ */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "light",
  "crt": "subtle",
  "accent": ["#12c596", "#1fb6d6"],
  "wallpaper": true,
  "boot": true
}/*EDITMODE-END*/;

/* ============================================================
   Main App
   ============================================================ */
function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const wm = useWindowManager();
  const [booting, setBooting] = useState(t.boot);
  const [startOpen, setStartOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [openMenu, ctxNode] = useContextMenu();
  const bootedRef = useRef(false);

  const setTheme = (mode) => setTweak("theme", mode);

  // apply theme + crt to root
  useEffect(() => {
    const r = document.documentElement;
    r.setAttribute("data-theme", t.theme);
    r.setAttribute("data-crt", t.crt);
    r.style.setProperty("--accent", t.accent[0]);
    r.style.setProperty("--accent-2", t.accent[1]);
  }, [t.theme, t.crt, t.accent]);

  // seed the hero windows after boot
  const seed = useCallback(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;
    wm.open("projects");
    setTimeout(() => wm.open("terminal"), 180);
    setTimeout(() => wm.open("hero"), 340);
  }, [wm]);

  useEffect(() => {
    if (!booting && !bootedRef.current) seed();
  }, [booting, seed]);

  // global hotkeys: ⌘K / Ctrl+K
  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPaletteOpen((o) => !o); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const launch = (app, payload) => { wm.open(app, payload); setStartOpen(false); };
  const taskClick = (id) => {
    const w = wm.wins.find((x) => x.id === id);
    if (w.minimized || w.id !== wm.activeId) wm.focus(id); else wm.minimize(id);
  };

  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", background: "#000" }}
      onContextMenu={(e) => { if (e.target.closest("[data-desktop-root]") === e.currentTarget) {} }}>

      {/* desktop surface */}
      <div data-desktop-root
        onContextMenu={(e) => { e.preventDefault(); openMenu(e, [
          { label: "Open Terminal", icon: "🖥️", onClick: () => wm.open("terminal") },
          { label: "Command Palette", icon: "⌨️", kbd: "⌘K", onClick: () => setPaletteOpen(true) },
          { sep: true },
          { label: t.theme === "dark" ? "Light theme" : "Dark CRT theme", icon: t.theme === "dark" ? "☀️" : "🌙", onClick: () => setTheme(t.theme === "dark" ? "light" : "dark") },
          { label: t.crt === "off" ? "Enable CRT" : "Disable CRT", icon: "📺", onClick: () => setTweak("crt", t.crt === "off" ? "subtle" : "off") },
          { sep: true },
          { label: "About RetroOS", icon: "📖", onClick: () => wm.open("readme") },
        ]); }}
        onPointerDown={() => setStartOpen(false)}
        style={{ position: "absolute", inset: 0 }}>

        <div className={cx("wallpaper", !t.wallpaper && "flat")}>
          <div className="wallpaper-haze" />
          <div className="wallpaper-sun" />
          <div className="wallpaper-grid" />
        </div>

        {/* top-left desktop brand */}
        <div className="chrome no-select" style={{ position: "absolute", top: 14, right: 18, textAlign: "right",
          color: "rgba(255,255,255,0.85)", textShadow: "0 0 14px rgba(255,95,210,0.6)", pointerEvents: "none" }}>
          <div style={{ fontSize: 28, letterSpacing: 1 }}>Retro<b style={{ color: "#36e0e0" }}>OS</b></div>
          <div className="mono" style={{ fontSize: 13, opacity: 0.8 }}>portfolio kit · v1.0.95</div>
        </div>

        <DesktopIcons onLaunch={(id) => wm.open(id)} openMenu={openMenu} />

        {/* windows */}
        {wm.wins.map((win) => (
          <RetroWindow key={win.id} title={win.title} icon={win.icon}
            x={win.x} y={win.y} w={win.w} h={win.h} z={win.z}
            active={win.id === wm.activeId} minimized={win.minimized} maximized={win.maximized}
            onFocus={() => wm.focus(win.id)} onMove={(x, y) => wm.move(win.id, x, y)}
            onResize={(w, h) => wm.resize(win.id, w, h)}
            onMin={() => wm.minimize(win.id)} onMax={() => wm.toggleMax(win.id)} onClose={() => wm.close(win.id)}
            statusbar={statusFor(win)}>
            <WindowContent win={win} wm={wm} onTheme={setTheme} />
          </RetroWindow>
        ))}

        <Dock onLaunch={(id) => wm.open(id)} />
      </div>

      {/* shell chrome */}
      {startOpen && <StartMenu onLaunch={launch} onClose={() => setStartOpen(false)} onPalette={() => setPaletteOpen(true)} />}
      <Taskbar windows={wm.wins} activeId={wm.activeId} startOpen={startOpen}
        onToggleStart={() => setStartOpen((o) => !o)} onTaskClick={taskClick} />

      {paletteOpen && <CommandPalette onLaunch={(a, p) => { wm.open(a, p); }} onClose={() => setPaletteOpen(false)} onTheme={setTheme} />}
      {ctxNode}

      <CRTLayer />

      {booting && <BootScreen onDone={() => setBooting(false)} />}

      {/* TWEAKS PANEL */}
      <TweaksPanel>
        <TweakSection label="Theme" />
        <TweakRadio label="Mode" value={t.theme} options={["light", "dark"]} onChange={(v) => setTweak("theme", v)} />
        <TweakColor label="Accent" value={t.accent} onChange={(v) => setTweak("accent", v)}
          options={[["#12c596", "#1fb6d6"], ["#e83fb0", "#1fb6d6"], ["#7a4ff5", "#36e0e0"], ["#283593", "#1f8a8a"]]} />
        <TweakSection label="Atmosphere" />
        <TweakRadio label="CRT effect" value={t.crt} options={["off", "subtle", "full"]} onChange={(v) => setTweak("crt", v)} />
        <TweakToggle label="Vaporwave wallpaper" value={t.wallpaper} onChange={(v) => setTweak("wallpaper", v)} />
        <TweakSection label="Startup" />
        <TweakToggle label="Boot sequence on load" value={t.boot} onChange={(v) => setTweak("boot", v)} />
        <TweakButton label="Replay boot" onClick={() => { bootedRef.current = false; wm.wins.forEach((w) => wm.close(w.id)); setBooting(true); }} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
