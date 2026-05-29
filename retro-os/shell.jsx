/* ============================================================
   RetroOS — Shell (Taskbar, StartMenu, Dock, CommandPalette)
   + the ReadMe / Design-System document content.
   ============================================================ */

const { useState, useRef, useEffect } = React;

/* ---------- App registry: id → metadata ---------- */
const APP_REGISTRY = {
  about:    { title: "About — " + PERSONA.name, icon: "👤", w: 560, h: 280 },
  projects: { title: "My Computer — Projects", icon: "🗂️", w: 560, h: 380 },
  files:    { title: "File Explorer — C:\\", icon: "📁", w: 600, h: 400 },
  terminal: { title: "Terminal", icon: "🖥️", w: 560, h: 360 },
  skills:   { title: "Skills Matrix", icon: "📊", w: 520, h: 420 },
  contact:  { title: "Contact", icon: "✉️", w: 480, h: 380 },
  readme:   { title: "ReadMe — Design System", icon: "📖", w: 680, h: 520 },
  resume:   { title: "resume.pdf", icon: "📄", w: 520, h: 460 },
  hero:     { title: "Welcome — " + PERSONA.handle, icon: "✨", w: 640, h: 380 },
};

/* ============================================================
   Clock + system tray
   ============================================================ */
function Clock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000 * 15); return () => clearInterval(t); }, []);
  const time = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return (
    <div className="bevel-in-thin no-select" style={{ padding: "3px 10px", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
      <span title="Volume" style={{ cursor: "default" }}>🔊</span>
      <span title="Network" style={{ cursor: "default" }}>📶</span>
      <span className="mono" style={{ minWidth: 56, textAlign: "center" }}>{time}</span>
    </div>
  );
}

/* ============================================================
   Taskbar — Start button + running window buttons + tray
   ============================================================ */
function Taskbar({ windows, activeId, onToggleStart, startOpen, onTaskClick }) {
  return (
    <div className="bevel-out no-select" style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 40,
      zIndex: "var(--z-taskbar)", background: "var(--surface)", display: "flex", alignItems: "center", gap: 6,
      padding: "0 6px", borderTop: "1px solid var(--bevel-light)" }}>
      <RetroButton active={startOpen} onClick={onToggleStart} size="md"
        style={{ fontFamily: "var(--font-chrome)", fontSize: 16, gap: 7, paddingInline: 12, height: 30 }}>
        <span style={{ fontSize: 16 }}>🪟</span> Start
      </RetroButton>
      <div style={{ width: 2, height: 26, borderLeft: "1px solid var(--bevel-shadow)", borderRight: "1px solid var(--bevel-light)" }} />
      <div style={{ flex: 1, display: "flex", gap: 4, overflow: "hidden" }}>
        {windows.map((win) => (
          <button key={win.id} onClick={() => onTaskClick(win.id)}
            className={cx("bevel-out-thin no-select truncate", (win.id === activeId && !win.minimized) && "bevel-pressed")}
            style={{ minWidth: 130, maxWidth: 170, height: 30, padding: "0 10px", fontFamily: "var(--font-body)", fontSize: 13,
              display: "flex", alignItems: "center", gap: 7, cursor: "pointer", textAlign: "left",
              background: (win.id === activeId && !win.minimized) ? "var(--surface-2)" : "var(--surface)",
              fontWeight: (win.id === activeId && !win.minimized) ? 700 : 500,
              opacity: win.minimized ? 0.7 : 1 }}>
            <span style={{ fontSize: 14 }}>{win.icon}</span>
            <span className="truncate">{win.title}</span>
          </button>
        ))}
      </div>
      <Clock />
    </div>
  );
}

/* ============================================================
   StartMenu — branded sidebar + launch list
   ============================================================ */
const START_ITEMS = [
  { id: "hero", label: "Welcome", icon: "✨" },
  { id: "about", label: "About Me", icon: "👤" },
  { id: "projects", label: "Projects", icon: "🗂️" },
  { id: "files", label: "File Explorer", icon: "📁" },
  { id: "skills", label: "Skills Matrix", icon: "📊" },
  { id: "terminal", label: "Terminal", icon: "🖥️" },
  { sep: true },
  { id: "readme", label: "Design System", icon: "📖" },
  { id: "resume", label: "Résumé", icon: "📄" },
  { id: "contact", label: "Contact", icon: "✉️" },
];
function StartMenu({ onLaunch, onClose, onPalette }) {
  useEffect(() => {
    const esc = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);
  return (
    <div className="bevel-out no-select" onPointerDown={(e) => e.stopPropagation()}
      style={{ position: "absolute", left: 6, bottom: 44, zIndex: "var(--z-startmenu)", width: 280,
        background: "var(--surface)", padding: 3, display: "flex", boxShadow: "var(--win-shadow)", animation: "win-open 0.12s ease-out" }}>
      {/* vertical brand strip */}
      <div style={{ width: 34, background: "linear-gradient(var(--accent), var(--accent-soft))", display: "flex",
        alignItems: "flex-end", justifyContent: "center", padding: "0 0 14px" }}>
        <span className="chrome" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", color: "#fff",
          fontSize: 19, letterSpacing: 2, textShadow: "1px 1px 0 rgba(0,0,0,0.4)" }}>
          Retro<b>OS</b>
        </span>
      </div>
      <div style={{ flex: 1, padding: "4px 0" }}>
        {START_ITEMS.map((it, i) => it.sep
          ? <div key={i} style={{ height: 2, margin: "4px 8px", borderTop: "1px solid var(--bevel-shadow)", borderBottom: "1px solid var(--bevel-light)" }} />
          : <StartItem key={it.id} {...it} onClick={() => { onLaunch(it.id); onClose(); }} />)}
        <div style={{ height: 2, margin: "4px 8px", borderTop: "1px solid var(--bevel-shadow)", borderBottom: "1px solid var(--bevel-light)" }} />
        <StartItem id="palette" label="Run…  ⌘K" icon="⌨️" onClick={() => { onClose(); onPalette(); }} />
      </div>
    </div>
  );
}
function StartItem({ label, icon, onClick }) {
  const [h, setH] = useState(false);
  return (
    <div role="menuitem" tabIndex={0} onClick={onClick}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      style={{ display: "flex", alignItems: "center", gap: 11, padding: "7px 12px", cursor: "pointer", fontSize: 14,
        background: h ? "var(--selection-bg)" : "transparent", color: h ? "var(--selection-text)" : "var(--text)" }}>
      <span style={{ fontSize: 18, width: 22, textAlign: "center" }}>{icon}</span>{label}
    </div>
  );
}

/* ============================================================
   Dock — macOS-classic-ish quick launch, bottom-center float
   (alternate launcher, complements the taskbar)
   ============================================================ */
const DOCK_ITEMS = [
  { id: "about", icon: "👤", label: "About" },
  { id: "projects", icon: "🗂️", label: "Projects" },
  { id: "files", icon: "📁", label: "Files" },
  { id: "terminal", icon: "🖥️", label: "Terminal" },
  { id: "skills", icon: "📊", label: "Skills" },
  { id: "contact", icon: "✉️", label: "Contact" },
];
function Dock({ onLaunch }) {
  return (
    <div className="bevel-out no-select" style={{ position: "absolute", left: "50%", bottom: 52, transform: "translateX(-50%)",
      zIndex: "var(--z-taskbar)", display: "flex", gap: 6, padding: 7, background: "var(--surface)", boxShadow: "var(--win-shadow)" }}>
      {DOCK_ITEMS.map((d) => (
        <Tooltip key={d.id} label={d.label}>
          <button onClick={() => onLaunch(d.id)} className="bevel-out focus-ring"
            style={{ width: 46, height: 46, fontSize: 24, background: "var(--surface)", cursor: "pointer",
              display: "grid", placeItems: "center", transition: "transform 0.12s" }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-6px) scale(1.08)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "none"}>
            {d.icon}
          </button>
        </Tooltip>
      ))}
    </div>
  );
}

/* ============================================================
   CommandPalette — ⌘K fuzzy launcher
   ============================================================ */
function CommandPalette({ onLaunch, onClose, onTheme }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const ref = useRef(null);
  const commands = [
    ...Object.keys(APP_REGISTRY).filter((k) => k !== "hero").map((k) => ({ id: k, label: "Open " + APP_REGISTRY[k].title.split("—")[0].trim(), icon: APP_REGISTRY[k].icon, run: () => onLaunch(k) })),
    ...PROJECTS.map((p) => ({ id: "prj-" + p.id, label: "Project: " + p.name, icon: p.icon, run: () => onLaunch("project", p.id) })),
    { id: "th-d", label: "Switch to Dark / CRT theme", icon: "🌙", run: () => onTheme("dark") },
    { id: "th-l", label: "Switch to Light theme", icon: "☀️", run: () => onTheme("light") },
  ];
  const filtered = commands.filter((c) => c.label.toLowerCase().includes(q.toLowerCase()));
  useEffect(() => { ref.current && ref.current.focus(); }, []);
  useEffect(() => { setSel(0); }, [q]);
  const onKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(s + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
    else if (e.key === "Enter") { const c = filtered[sel]; if (c) { c.run(); onClose(); } }
    else if (e.key === "Escape") onClose();
  };
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: "var(--z-palette)", display: "flex", justifyContent: "center",
      paddingTop: "14vh", background: "rgba(0,0,0,0.25)" }} onPointerDown={onClose}>
      <div className="bevel-out" onPointerDown={(e) => e.stopPropagation()}
        style={{ width: 460, maxWidth: "92vw", maxHeight: "60vh", background: "var(--surface)", padding: 3,
          boxShadow: "var(--win-shadow)", display: "flex", flexDirection: "column", animation: "win-open 0.12s ease-out" }}>
        <WindowHeader icon="⌨️" title="Run — type to filter" active onClose={onClose} />
        <div style={{ padding: 6 }}>
          <input ref={ref} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey}
            placeholder="Open app, project, switch theme…" aria-label="command"
            className="bevel-in-thin" style={{ ...inputStyle, fontSize: 16, padding: "8px 10px" }} />
        </div>
        <div className="retro-scroll" style={{ overflow: "auto", padding: "0 6px 6px" }}>
          {filtered.length === 0 && <div style={{ padding: 14, color: "var(--text-dim)", fontSize: 14 }}>No matches.</div>}
          {filtered.map((c, i) => (
            <div key={c.id} onMouseEnter={() => setSel(i)} onClick={() => { c.run(); onClose(); }}
              style={{ display: "flex", alignItems: "center", gap: 11, padding: "8px 10px", cursor: "pointer", fontSize: 14,
                background: i === sel ? "var(--selection-bg)" : "transparent", color: i === sel ? "var(--selection-text)" : "var(--text)" }}>
              <span style={{ fontSize: 17, width: 22, textAlign: "center" }}>{c.icon}</span>
              <span style={{ flex: 1 }}>{c.label}</span>
              {i === sel && <span className="mono" style={{ fontSize: 13, opacity: 0.8 }}>↵</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { APP_REGISTRY, Clock, Taskbar, StartMenu, Dock, CommandPalette });
