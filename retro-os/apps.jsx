/* ============================================================
   RetroOS — Composed Portfolio Apps
   These consume primitives + portfolio DATA. This is the
   "your-site" layer; primitives stay content-free.
   ============================================================ */

/* ---------- Portfolio content (single source of truth) ---------- */
const { useState, useRef, useEffect, useCallback } = React;

const PERSONA = {
  name: "Ola Normann",
  handle: "ola.dev",
  role: "Software Developer",
  blurb: "I build fast, dependable software — full-stack web apps, developer tooling, and the systems that hold them together. Ten years shipping production code and sweating the details users never notice but always feel.",
  location: "Oslo, NO",
  status: "Open to senior roles",
  email: "ola@ola.dev",
};

const PROJECTS = [
  { id: "p1", name: "Cassette", kind: "Design system", year: "2025", icon: "📼",
    tag: "Lead", summary: "A 200-component, fully-tokenized system powering 9 products. Cut design-to-ship time 40%.",
    stack: ["React", "TypeScript", "Tokens Studio", "Storybook"], color: "#b5327e",
    detail: "Owned the architecture: primitives vs. patterns split, a three-tier token pipeline (global → alias → component), and a contribution model that let 30 engineers ship components safely. Shipped dark mode across the suite in one release." },
  { id: "p2", name: "Phosphor", kind: "Dev tool", year: "2024", icon: "🖥️",
    tag: "Solo", summary: "A terminal-first prototyping playground. 12k weekly users, 4.9★.",
    stack: ["Rust", "WebGL", "WASM"], color: "#2d6a8e",
    detail: "Real-time canvas with a scripting layer; renders 60fps on a decade-old laptop. Built the WASM bridge and the plugin API used by 40+ community extensions." },
  { id: "p3", name: "Relay", kind: "Backend", year: "2023", icon: "📡",
    tag: "Tech lead", summary: "An event-streaming gateway handling 80k msg/sec at four nines of uptime.",
    stack: ["Go", "Kafka", "gRPC", "k8s"], color: "#1f8a6e",
    detail: "Designed the partitioning and back-pressure model, cut p99 latency from 240ms to 38ms, and wrote the replay tooling the on-call team actually likes using." },
  { id: "p4", name: "Ledger95", kind: "Side project", year: "2022", icon: "💾",
    tag: "Solo", summary: "A retro budgeting app that looks like a 90s desktop (yes, like this one).",
    stack: ["Svelte", "SQLite", "Tauri"], color: "#7a3a9e",
    detail: "Local-first finance app. The skeuomorphic ledger book and the chunky calculator are the whole pitch — and people love them." },
];

const SKILLS = [
  { group: "Languages", items: [["TypeScript", 95], ["Go", 84], ["Rust", 70], ["Python", 80]] },
  { group: "Frontend", items: [["React / Svelte", 94], ["CSS architecture", 90], ["Animation", 78], ["WebGL", 58]] },
  { group: "Platform", items: [["Node / APIs", 92], ["Databases", 85], ["CI / Docker / k8s", 82], ["Accessibility", 86]] },
];

const FILES = {
  "C:\\": [
    { name: "Projects", type: "folder", to: "Projects" },
    { name: "About", type: "folder", to: "About" },
    { name: "resume.pdf", type: "file", ext: "pdf", action: "resume" },
    { name: "readme.txt", type: "file", ext: "txt", action: "readme" },
    { name: "contact.exe", type: "file", ext: "exe", action: "contact" },
  ],
  "Projects": PROJECTS.map((p) => ({ name: `${p.name}.prj`, type: "file", ext: "prj", action: "project", payload: p.id })),
  "About": [
    { name: "bio.txt", type: "file", ext: "txt", action: "about" },
    { name: "skills.dat", type: "file", ext: "dat", action: "skills" },
    { name: "photo.bmp", type: "file", ext: "bmp" },
  ],
};

/* ============================================================
   AboutSection
   ============================================================ */
function AboutSection() {
  return (
    <div style={{ padding: "var(--sp-4)", display: "grid", gridTemplateColumns: "120px 1fr", gap: "var(--sp-4)", alignItems: "start" }}>
      <div className="bevel-in" style={{ width: 120, height: 150, overflow: "hidden" }}>
        <div className="img-placeholder" style={{ width: "100%", height: "100%" }}>photo.bmp</div>
      </div>
      <div>
        <h2 className="chrome" style={{ margin: "0 0 2px", fontSize: 24 }}>{PERSONA.name}</h2>
        <div className="mono" style={{ fontSize: 16, color: "var(--accent-2)", marginBottom: 10 }}>{PERSONA.role}</div>
        <p style={{ margin: "0 0 12px", fontSize: 14, lineHeight: 1.5, textWrap: "pretty" }}>{PERSONA.blurb}</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", fontSize: 13 }}>
          <Badge>📍 {PERSONA.location}</Badge>
          <Badge tone="ok">● {PERSONA.status}</Badge>
        </div>
      </div>
    </div>
  );
}
function Badge({ children, tone }) {
  return (
    <span className="bevel-out-thin" style={{ padding: "2px 8px", background: "var(--surface)",
      fontSize: 12, color: tone === "ok" ? "var(--ok)" : "var(--text)" }}>{children}</span>
  );
}

/* ============================================================
   SkillsMatrix — animated meters
   ============================================================ */
function SkillsMatrix() {
  const [shown, setShown] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShown(true), 60); return () => clearTimeout(t); }, []);
  return (
    <div style={{ padding: "var(--sp-4)", display: "grid", gap: "var(--sp-4)" }}>
      {SKILLS.map((g) => (
        <GroupBox key={g.group} label={g.group}>
          <div style={{ display: "grid", gap: 9 }}>
            {g.items.map(([name, val]) => (
              <div key={name} style={{ display: "grid", gridTemplateColumns: "130px 1fr 42px", gap: 10, alignItems: "center" }}>
                <span style={{ fontSize: 13 }}>{name}</span>
                <div className="bevel-in" style={{ height: 16, background: "var(--surface-2)", padding: 2 }}>
                  <div style={{ height: "100%", width: shown ? `${val}%` : 0, transition: "width 0.9s cubic-bezier(.2,.8,.2,1)",
                    background: "repeating-linear-gradient(90deg, var(--accent) 0 8px, var(--accent-2) 8px 9px)" }} />
                </div>
                <span className="mono" style={{ fontSize: 14, textAlign: "right", color: "var(--text-dim)" }}>{val}%</span>
              </div>
            ))}
          </div>
        </GroupBox>
      ))}
    </div>
  );
}

/* ============================================================
   ProjectWindow body — a single project detail
   ============================================================ */
function ProjectView({ project }) {
  const p = project;
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ height: 120, position: "relative", flexShrink: 0,
        background: `linear-gradient(135deg, ${p.color}, color-mix(in oklab, ${p.color}, #000 45%))` }}>
        <div className="img-placeholder" style={{ position: "absolute", inset: 0, background: "transparent",
          backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,0.12) 0 1px, transparent 1px 10px)", color: "rgba(255,255,255,0.85)" }}>
          {p.name} — cover shot
        </div>
        <div style={{ position: "absolute", left: 12, bottom: 10, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 34, filter: "drop-shadow(1px 2px 0 rgba(0,0,0,0.4))" }}>{p.icon}</span>
          <div>
            <div className="chrome" style={{ fontSize: 22, color: "#fff", textShadow: "1px 1px 0 rgba(0,0,0,0.4)" }}>{p.name}</div>
            <div className="mono" style={{ fontSize: 14, color: "rgba(255,255,255,0.85)" }}>{p.kind} · {p.year} · {p.tag}</div>
          </div>
        </div>
      </div>
      <div style={{ padding: "var(--sp-4)", display: "grid", gap: 12 }}>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5, fontWeight: 600, textWrap: "pretty" }}>{p.summary}</p>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "var(--text-dim)", textWrap: "pretty" }}>{p.detail}</p>
        <GroupBox label="Stack">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {p.stack.map((s) => <Badge key={s}>{s}</Badge>)}
          </div>
        </GroupBox>
        <div style={{ display: "flex", gap: 8 }}>
          <RetroButton variant="primary">↗ Live demo</RetroButton>
          <RetroButton>◷ Case study</RetroButton>
          <RetroButton>⌥ Source</RetroButton>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   FileExplorer — tree + list, double-click to open/launch
   onLaunch(action, payload) bubbles to the window manager.
   ============================================================ */
function FileExplorer({ onLaunch, initialPath = "C:\\" }) {
  const [path, setPath] = useState(initialPath);
  const [sel, setSel] = useState(null);
  const [openMenu, ctxNode] = useContextMenu();
  const entries = FILES[path] || [];
  const crumb = path === "C:\\" ? ["C:"] : ["C:", path];
  const iconFor = (e) => e.type === "folder" ? "📁" : ({ pdf: "📄", txt: "📃", exe: "⚙️", prj: "🗂️", dat: "📊", bmp: "🖼️" }[e.ext] || "📄");

  const activate = (e) => {
    if (e.type === "folder") { setPath(e.to); setSel(null); return; }
    if (e.action) onLaunch(e.action, e.payload);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* toolbar */}
      <div className="no-select" style={{ display: "flex", gap: 6, padding: "4px 6px", alignItems: "center", borderBottom: "1px solid var(--bevel-shadow)" }}>
        <RetroButton size="sm" disabled={path === "C:\\"} onClick={() => { setPath("C:\\"); setSel(null); }}>← Back</RetroButton>
        <RetroButton size="sm" disabled={path === "C:\\"} onClick={() => { setPath("C:\\"); setSel(null); }}>↑ Up</RetroButton>
        <div className="bevel-in-thin mono" style={{ flex: 1, padding: "3px 8px", background: "var(--surface-3)", fontSize: 14 }}>
          {crumb.join("\\")}
        </div>
      </div>
      {/* body: tree + list */}
      <div style={{ display: "grid", gridTemplateColumns: "130px 1fr", flex: 1, minHeight: 0 }}>
        <div className="bevel-in retro-scroll" style={{ background: "var(--surface-3)", padding: 6, overflow: "auto", margin: 3, marginRight: 0 }}>
          <TreeNode label="C:" icon="💽" active={path === "C:\\"} onClick={() => setPath("C:\\")} />
          <div style={{ paddingLeft: 12 }}>
            <TreeNode label="Projects" icon="📁" active={path === "Projects"} onClick={() => setPath("Projects")} />
            <TreeNode label="About" icon="📁" active={path === "About"} onClick={() => setPath("About")} />
          </div>
        </div>
        <div className="retro-scroll" style={{ overflow: "auto", padding: 8, alignContent: "start",
          display: "grid", gridTemplateColumns: "repeat(auto-fill, 86px)", gap: 4 }}
          onClick={() => setSel(null)}>
          {entries.map((e) => {
            const isSel = sel === e.name;
            return (
              <button key={e.name} className="focus-ring no-select"
                onClick={(ev) => { ev.stopPropagation(); setSel(e.name); }}
                onDoubleClick={() => activate(e)}
                onContextMenu={(ev) => openMenu(ev, [
                  { label: "Open", icon: "↗", onClick: () => activate(e) },
                  { sep: true },
                  { label: "Properties", icon: "ⓘ", disabled: true, kbd: "Alt+↵" },
                ])}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "6px 2px",
                  background: isSel ? "var(--selection-bg)" : "transparent", border: "1px dotted transparent",
                  borderColor: isSel ? "var(--bevel-light)" : "transparent", cursor: "pointer" }}>
                <span style={{ fontSize: 26 }}>{iconFor(e)}</span>
                <span style={{ fontSize: 12, textAlign: "center", lineHeight: 1.1, wordBreak: "break-word",
                  color: isSel ? "var(--selection-text)" : "var(--text)" }}>{e.name}</span>
              </button>
            );
          })}
        </div>
      </div>
      {ctxNode}
    </div>
  );
}
function TreeNode({ label, icon, active, onClick }) {
  return (
    <div onClick={onClick} className="no-select" style={{ display: "flex", alignItems: "center", gap: 5, padding: "2px 4px",
      fontSize: 13, cursor: "pointer", background: active ? "var(--selection-bg)" : "transparent",
      color: active ? "var(--selection-text)" : "var(--text)" }}>
      <span>{icon}</span>{label}
    </div>
  );
}

/* ============================================================
   TerminalPanel — a real, typeable shell
   Commands: help, ls, cat, open, projects, about, skills,
   whoami, contact, theme, clear, sudo, neofetch
   ============================================================ */
const TERM_BANNER = [
  "RetroOS Terminal [Version 1.0.95]",
  "(c) " + PERSONA.name + ". Type 'help' for commands.",
  "",
];
function TerminalPanel({ onLaunch, onTheme }) {
  const [lines, setLines] = useState(TERM_BANNER.map((t) => ({ t })));
  const [input, setInput] = useState("");
  const [hist, setHist] = useState([]);
  const [hi, setHi] = useState(-1);
  const bodyRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight; }, [lines]);

  const print = (arr) => setLines((l) => [...l, ...arr.map((t) => typeof t === "string" ? { t } : t)]);

  const run = (raw) => {
    const cmd = raw.trim();
    print([{ t: `${PERSONA.handle} %~ ` + cmd, prompt: true }]);
    const [c, ...args] = cmd.split(/\s+/);
    switch ((c || "").toLowerCase()) {
      case "": break;
      case "help": print([
        "Available commands:",
        "  whoami        about the author",
        "  projects      list portfolio projects",
        "  open <name>   open a project / app window",
        "  skills        show skills matrix",
        "  about         open the about window",
        "  contact       open the contact terminal",
        "  ls / cat      poke around the filesystem",
        "  theme <l|d>   switch light / dark (CRT)",
        "  neofetch      system summary",
        "  clear         clear the screen", ""]); break;
      case "whoami": print([`${PERSONA.name} — ${PERSONA.role}`, PERSONA.blurb, ""]); break;
      case "projects": print([...PROJECTS.map((p) => `  ${p.icon}  ${p.name.padEnd(10)} ${p.kind} (${p.year})`),
        "", "→ run 'open <name>' for details", ""]); break;
      case "open": {
        const q = (args[0] || "").toLowerCase();
        const p = PROJECTS.find((x) => x.name.toLowerCase() === q);
        if (p) { onLaunch("project", p.id); print([`Opening ${p.name}…`, ""]); }
        else if (["about", "skills", "contact", "files", "readme"].includes(q)) { onLaunch(q); print([`Opening ${q}…`, ""]); }
        else print([{ t: `open: '${args[0] || ""}' not found. try 'projects'`, tone: "err" }, ""]);
        break;
      }
      case "skills": onLaunch("skills"); print(["Launching skills matrix…", ""]); break;
      case "about": onLaunch("about"); print(["Launching about…", ""]); break;
      case "contact": onLaunch("contact"); print(["Launching contact terminal…", ""]); break;
      case "ls": print([(FILES["C:\\"]).map((e) => e.name).join("   "), ""]); break;
      case "cat": print([args[0] === "readme.txt" ? PERSONA.blurb : `cat: ${args[0] || ""}: try 'ls'`, ""]); break;
      case "theme": {
        const m = (args[0] || "").toLowerCase();
        if (m.startsWith("d")) { onTheme("dark"); print(["→ dark CRT theme", ""]); }
        else if (m.startsWith("l")) { onTheme("light"); print(["→ light system theme", ""]); }
        else print([{ t: "usage: theme <light|dark>", tone: "warn" }, ""]);
        break;
      }
      case "neofetch": print([
        { t: PERSONA.handle + "@retro-os", tone: "accent" },
        "-----------------",
        "OS:      RetroOS 1.0.95",
        "Shell:   retro-sh 5.0",
        "WM:      BevelWM",
        "Theme:   system-grey / phosphor",
        "Uptime:  10 years",
        `Role:    ${PERSONA.role}`, ""]); break;
      case "sudo": print([{ t: "Nice try. You already have root here. 😉", tone: "warn" }, ""]); break;
      case "clear": setLines([]); return;
      default: print([{ t: `command not found: ${c}. type 'help'.`, tone: "err" }, ""]);
    }
  };

  const onKey = (e) => {
    if (e.key === "Enter") { setHist((h) => [input, ...h].slice(0, 50)); setHi(-1); run(input); setInput(""); }
    else if (e.key === "ArrowUp") { e.preventDefault(); const n = Math.min(hi + 1, hist.length - 1); if (hist[n] != null) { setHi(n); setInput(hist[n]); } }
    else if (e.key === "ArrowDown") { e.preventDefault(); const n = hi - 1; if (n < 0) { setHi(-1); setInput(""); } else { setHi(n); setInput(hist[n]); } }
  };

  const toneColor = (t) => t === "err" ? "var(--err)" : t === "warn" ? "var(--warn)" : t === "accent" ? "var(--accent-2)" : "inherit";

  return (
    <div onClick={() => inputRef.current && inputRef.current.focus()}
      style={{ background: "#04120a", color: "#3dff8f", fontFamily: "var(--font-mono)", fontSize: 17,
        height: "100%", display: "flex", flexDirection: "column", cursor: "text" }}>
      <div ref={bodyRef} className="retro-scroll" style={{ flex: 1, overflow: "auto", padding: "8px 10px", lineHeight: 1.35,
        textShadow: "0 0 6px rgba(61,255,143,0.4)" }}>
        {lines.map((l, i) => (
          <div key={i} style={{ color: l.prompt ? "#9fffce" : toneColor(l.tone), whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{l.t}</div>
        ))}
        <div style={{ display: "flex" }}>
          <span style={{ color: "#9fffce" }}>{PERSONA.handle}&nbsp;%~&nbsp;</span>
          <span style={{ whiteSpace: "pre-wrap" }}>{input}</span>
          <span style={{ animation: "caret-blink 1s steps(1) infinite", marginLeft: 1 }}>█</span>
          <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKey}
            aria-label="terminal input" autoFocus
            style={{ position: "absolute", opacity: 0, width: 1, height: 1, pointerEvents: "none" }} />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   ContactTerminal — validated form, retro submit
   ============================================================ */
function ContactTerminal() {
  const [f, setF] = useState({ name: "", email: "", msg: "" });
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState({});
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const submit = () => {
    const er = {};
    if (!f.name.trim()) er.name = "Required";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email)) er.email = "Enter a valid email";
    if (f.msg.trim().length < 4) er.msg = "Say a little more";
    setErr(er);
    if (Object.keys(er).length === 0) setSent(true);
  };
  if (sent) return (
    <div className="mono" style={{ padding: "var(--sp-5)", textAlign: "center", display: "grid", gap: 10, placeItems: "center" }}>
      <div style={{ fontSize: 40 }}>📨</div>
      <div style={{ fontSize: 18 }}>Message transmitted.</div>
      <div style={{ fontSize: 14, color: "var(--text-dim)" }}>I'll reply from {PERSONA.email}.</div>
      <RetroButton onClick={() => { setSent(false); setF({ name: "", email: "", msg: "" }); }}>Send another</RetroButton>
    </div>
  );
  return (
    <div style={{ padding: "var(--sp-4)", display: "grid", gap: 12 }}>
      <div className="mono" style={{ fontSize: 15, color: "var(--accent-2)" }}>{">"} establishing connection to {PERSONA.email}…</div>
      <Field label="Name" err={err.name}><input value={f.name} onChange={set("name")} className="bevel-in-thin retro-input" style={inputStyle} /></Field>
      <Field label="Email" err={err.email}><input value={f.email} onChange={set("email")} className="bevel-in-thin retro-input" style={inputStyle} placeholder="you@domain.com" /></Field>
      <Field label="Message" err={err.msg}><textarea value={f.msg} onChange={set("msg")} rows={4} className="bevel-in-thin retro-input" style={{ ...inputStyle, resize: "vertical" }} /></Field>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <RetroButton onClick={() => setF({ name: "", email: "", msg: "" })}>Clear</RetroButton>
        <RetroButton variant="primary" onClick={submit}>▶ Transmit</RetroButton>
      </div>
    </div>
  );
}
const inputStyle = { width: "100%", padding: "6px 8px", fontFamily: "var(--font-body)", fontSize: 14,
  background: "var(--surface-3)", color: "var(--text)", border: "none", outline: "none", boxShadow: "var(--field-glow)" };
function Field({ label, err, children }) {
  return (
    <label style={{ display: "grid", gap: 4 }}>
      <span style={{ fontSize: 13, fontWeight: 600 }}>{label} {err && <span style={{ color: "var(--err)", fontWeight: 400 }}>— {err}</span>}</span>
      {children}
    </label>
  );
}

Object.assign(window, {
  PERSONA, PROJECTS, SKILLS, FILES, inputStyle,
  AboutSection, Badge, SkillsMatrix, ProjectView, FileExplorer, TerminalPanel, ContactTerminal,
});
