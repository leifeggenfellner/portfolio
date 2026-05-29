/* ============================================================
   RetroOS — Primitives (the design-system layer)
   Low-level, presentational, variant-driven. No portfolio
   content here. Composed apps live in apps.jsx.
   Exposed on window for cross-file (Babel) sharing.
   ============================================================ */
const { useState, useRef, useEffect, useCallback, useLayoutEffect, createContext, useContext } = React;

/* ---- tiny classnames helper ---- */
function cx(...a) { return a.filter(Boolean).join(" "); }

/* ============================================================
   RetroButton — variant + size driven
   variants: default | primary | ghost | icon
   ============================================================ */
function RetroButton({ variant = "default", size = "md", active, disabled, className, children, ...rest }) {
  const [pressed, setPressed] = useState(false);
  const sizes = {
    sm: { padding: "2px 8px", fontSize: 13, minHeight: 22 },
    md: { padding: "5px 16px", fontSize: 14, minHeight: 28 },
    lg: { padding: "8px 22px", fontSize: 16, minHeight: 36 },
    icon: { padding: 0, width: 26, height: 26, fontSize: 14 },
  };
  const isIcon = variant === "icon" || size === "icon";
  const sz = sizes[isIcon ? "icon" : size];
  const base = {
    fontFamily: "var(--font-body)",
    fontWeight: 600,
    color: variant === "primary" ? "var(--title-active-text)" : "var(--text)",
    background: variant === "primary"
      ? "linear-gradient(var(--accent-soft), var(--accent))"
      : variant === "ghost" ? "transparent" : "var(--surface)",
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.55 : 1,
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
    lineHeight: 1, whiteSpace: "nowrap", position: "relative",
    ...sz,
  };
  return (
    <button
      className={cx("focus-ring no-select", variant !== "ghost" && "bevel-out",
        (pressed || active) && variant !== "ghost" && "bevel-pressed", className)}
      style={base}
      disabled={disabled}
      onMouseDown={() => !disabled && setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      {...rest}
    >
      <span style={{ transform: (pressed || active) && variant !== "ghost" ? "translate(1px,1px)" : "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
        {children}
      </span>
    </button>
  );
}

/* ============================================================
   RetroCard — compound: Card / Card.Title / Card.Body
   ============================================================ */
function RetroCard({ raised = true, className, style, children }) {
  return (
    <div className={cx(raised ? "bevel-out" : "bevel-in", className)}
      style={{ background: "var(--surface)", ...style }}>
      {children}
    </div>
  );
}
RetroCard.Title = function CardTitle({ children, right }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "6px 10px", borderBottom: "1px solid var(--bevel-shadow)",
      fontFamily: "var(--font-chrome)", fontSize: 15 }}>
      <span>{children}</span>{right}
    </div>
  );
};
RetroCard.Body = function CardBody({ children, style }) {
  return <div style={{ padding: "var(--sp-3)", ...style }}>{children}</div>;
};

/* ============================================================
   GroupBox — fieldset-style sunk frame with a label notch
   ============================================================ */
function GroupBox({ label, children, style }) {
  return (
    <fieldset className="bevel-in-thin" style={{ position: "relative", margin: 0,
      padding: "16px 12px 12px", background: "transparent", ...style }}>
      {label && <legend style={{ padding: "0 6px", fontSize: 13, color: "var(--text-dim)" }}>{label}</legend>}
      {children}
    </fieldset>
  );
}

/* ============================================================
   WindowHeader — title bar with traffic/system buttons.
   Used standalone OR by RetroWindow. Compound-friendly.
   ============================================================ */
function WindowHeader({ icon, title, active = true, onMin, onMax, onClose, onPointerDown, maximized }) {
  return (
    <div
      className="no-select chrome"
      onPointerDown={onPointerDown}
      onDoubleClick={onMax}
      style={{
        display: "flex", alignItems: "center", gap: 6, padding: "3px 4px 3px 6px",
        height: 28, cursor: "move",
        background: active
          ? "linear-gradient(90deg, var(--title-active-from), var(--title-active-to))"
          : "linear-gradient(90deg, var(--title-inactive-from), var(--title-inactive-to))",
        color: active ? "var(--title-active-text)" : "var(--title-inactive-text)",
      }}
    >
      {icon && <span style={{ fontSize: 15, lineHeight: 1, filter: active ? "none" : "grayscale(1) opacity(0.6)" }}>{icon}</span>}
      <span style={{ flex: 1, fontSize: 15, textShadow: active ? "1px 1px 0 rgba(0,0,0,0.35)" : "none",
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span>
      <div style={{ display: "flex", gap: 3 }} onPointerDown={(e) => e.stopPropagation()}>
        {onMin && <SysBtn label="Minimize" onClick={onMin}><span style={{ marginTop: 6 }}>▁</span></SysBtn>}
        {onMax && <SysBtn label="Maximize" onClick={onMax}>{maximized ? "❐" : "▢"}</SysBtn>}
        {onClose && <SysBtn label="Close" onClick={onClose}>✕</SysBtn>}
      </div>
    </div>
  );
}
function SysBtn({ children, label, onClick }) {
  return (
    <RetroButton variant="icon" aria-label={label} title={label}
      onClick={onClick}
      style={{ width: 22, height: 20, fontSize: 12, fontWeight: 700, color: "var(--text)" }}>
      <span style={{ lineHeight: 1, fontFamily: "var(--font-body)" }}>{children}</span>
    </RetroButton>
  );
}

/* ============================================================
   RetroWindow — draggable / focusable / resizable-ish frame.
   Controlled by the window manager (apps gets pos/z via props),
   but standalone-capable for static demos.
   ============================================================ */
function RetroWindow({
  title, icon, children, active = true, x = 40, y = 40, w = 420, h, z = 100,
  minimized, maximized, onFocus, onMove, onMin, onMax, onClose, statusbar, noChrome,
  resizable = true, onResize, style,
}) {
  const drag = useRef(null);
  const winRef = useRef(null);

  const startDrag = useCallback((e) => {
    if (maximized) return;
    onFocus && onFocus();
    const sx = e.clientX, sy = e.clientY;
    drag.current = { sx, sy, ox: x, oy: y };
    const move = (ev) => {
      if (!drag.current) return;
      const nx = drag.current.ox + (ev.clientX - drag.current.sx);
      const ny = Math.max(0, drag.current.oy + (ev.clientY - drag.current.sy));
      onMove && onMove(nx, ny);
    };
    const up = () => { drag.current = null; window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }, [x, y, maximized, onFocus, onMove]);

  const startResize = useCallback((e) => {
    e.stopPropagation();
    onFocus && onFocus();
    const sx = e.clientX, sy = e.clientY;
    const ow = winRef.current.offsetWidth, oh = winRef.current.offsetHeight;
    const move = (ev) => {
      onResize && onResize(Math.max(260, ow + (ev.clientX - sx)), Math.max(160, oh + (ev.clientY - sy)));
    };
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }, [onFocus, onResize]);

  if (minimized) return null;

  const frame = maximized
    ? { left: 0, top: 0, width: "100%", height: "calc(100% - 2px)" }
    : { left: x, top: y, width: w, height: h };

  return (
    <div
      ref={winRef}
      className="bevel-out"
      onPointerDown={() => onFocus && onFocus()}
      style={{
        position: "absolute", ...frame, zIndex: z, background: "var(--surface)",
        boxShadow: active ? "var(--win-shadow)" : "2px 2px 0 rgba(0,0,0,0.18)",
        display: "flex", flexDirection: "column", animation: "win-open 0.16s ease-out",
        padding: 3, ...style,
      }}
    >
      {!noChrome && (
        <WindowHeader icon={icon} title={title} active={active}
          onPointerDown={startDrag} onMin={onMin} onMax={onMax} onClose={onClose} maximized={maximized} />
      )}
      <div className="bevel-in retro-scroll" style={{ flex: 1, minHeight: 0, background: "var(--surface-3)",
        marginTop: noChrome ? 0 : 2, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {children}
      </div>
      {statusbar && (
        <div className="bevel-in-thin" style={{ marginTop: 3, padding: "2px 6px", fontSize: 12,
          color: "var(--text-dim)", display: "flex", gap: 14, background: "var(--surface)" }}>
          {Array.isArray(statusbar) ? statusbar.map((s, i) => <span key={i}>{s}</span>) : statusbar}
        </div>
      )}
      {resizable && !maximized && (
        <div onPointerDown={startResize} title="Resize"
          style={{ position: "absolute", right: 0, bottom: 0, width: 16, height: 16, cursor: "nwse-resize",
            backgroundImage: "repeating-linear-gradient(135deg, var(--bevel-shadow) 0 1px, transparent 1px 3px)" }} />
      )}
    </div>
  );
}

/* ============================================================
   Tabs — compound, roving-tabindex, ARIA tablist
   ============================================================ */
function Tabs({ tabs, value, onChange }) {
  const idx = tabs.findIndex((t) => t.id === value);
  const onKey = (e) => {
    if (e.key === "ArrowRight") onChange(tabs[(idx + 1) % tabs.length].id);
    if (e.key === "ArrowLeft") onChange(tabs[(idx - 1 + tabs.length) % tabs.length].id);
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <div role="tablist" onKeyDown={onKey} style={{ display: "flex", gap: 2, padding: "4px 4px 0", position: "relative", zIndex: 2 }}>
        {tabs.map((t) => {
          const sel = t.id === value;
          return (
            <button key={t.id} role="tab" aria-selected={sel} tabIndex={sel ? 0 : -1}
              onClick={() => onChange(t.id)}
              className="bevel-out-thin no-select focus-ring"
              style={{
                fontFamily: "var(--font-body)", fontSize: 13, fontWeight: sel ? 700 : 500,
                padding: sel ? "6px 14px 8px" : "5px 14px 5px", cursor: "pointer",
                background: sel ? "var(--surface)" : "var(--surface-2)",
                color: sel ? "var(--text)" : "var(--text-dim)",
                borderBottom: sel ? "none" : "1px solid var(--bevel-shadow)",
                marginBottom: sel ? -2 : 0, position: "relative", zIndex: sel ? 3 : 1,
              }}>
              {t.icon && <span style={{ marginRight: 5 }}>{t.icon}</span>}{t.label}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" className="bevel-out retro-scroll" style={{ flex: 1, minHeight: 0, overflow: "auto",
        background: "var(--surface)", padding: "var(--sp-4)", position: "relative", zIndex: 1 }}>
        {tabs[idx >= 0 ? idx : 0].content}
      </div>
    </div>
  );
}

/* ============================================================
   Tooltip — hover/focus, retro yellow note style
   ============================================================ */
function Tooltip({ label, children, side = "top" }) {
  const [show, setShow] = useState(false);
  const pos = side === "top"
    ? { bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)" }
    : { top: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)" };
  return (
    <span style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)} onBlur={() => setShow(false)}>
      {children}
      {show && (
        <span role="tooltip" className="no-select" style={{ position: "absolute", ...pos, zIndex: "var(--z-menu)",
          background: "#ffffe1", color: "#000", border: "1px solid #000", padding: "2px 7px",
          fontSize: 12, fontFamily: "var(--font-body)", whiteSpace: "nowrap", pointerEvents: "none",
          boxShadow: "1px 1px 0 rgba(0,0,0,0.4)" }}>
          {label}
        </span>
      )}
    </span>
  );
}

/* ============================================================
   ContextMenu — right-click menu, portal-positioned
   items: [{label, icon, onClick, sep, disabled, kbd}]
   ============================================================ */
function ContextMenu({ items, x, y, onClose }) {
  const ref = useRef(null);
  const [p, setP] = useState({ x, y });
  useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    setP({
      x: Math.min(x, window.innerWidth - r.width - 6),
      y: Math.min(y, window.innerHeight - r.height - 6),
    });
  }, [x, y]);
  useEffect(() => {
    const h = () => onClose();
    window.addEventListener("pointerdown", h);
    window.addEventListener("blur", h);
    const esc = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => { window.removeEventListener("pointerdown", h); window.removeEventListener("blur", h); window.removeEventListener("keydown", esc); };
  }, [onClose]);
  return (
    <div ref={ref} className="bevel-out no-select" role="menu"
      onPointerDown={(e) => e.stopPropagation()}
      style={{ position: "fixed", left: p.x, top: p.y, zIndex: "var(--z-menu)", background: "var(--surface)",
        minWidth: 180, padding: 3, animation: "pop-in 0.08s ease-out", boxShadow: "var(--win-shadow)" }}>
      {items.map((it, i) => it.sep ? (
        <div key={i} style={{ height: 2, margin: "3px 2px", borderTop: "1px solid var(--bevel-shadow)", borderBottom: "1px solid var(--bevel-light)" }} />
      ) : (
        <MenuItem key={i} {...it} onClose={onClose} />
      ))}
    </div>
  );
}
function MenuItem({ label, icon, onClick, disabled, kbd, onClose }) {
  const [h, setH] = useState(false);
  return (
    <div role="menuitem" tabIndex={disabled ? -1 : 0}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      onClick={() => { if (!disabled) { onClick && onClick(); onClose && onClose(); } }}
      style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 18px 4px 10px", fontSize: 13,
        cursor: disabled ? "default" : "pointer", color: disabled ? "var(--text-disabled)" : (h ? "var(--selection-text)" : "var(--text)"),
        background: h && !disabled ? "var(--selection-bg)" : "transparent" }}>
      <span style={{ width: 16, textAlign: "center" }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {kbd && <span className="mono" style={{ fontSize: 13, opacity: 0.7 }}>{kbd}</span>}
    </div>
  );
}
/* hook to wire right-click → context menu */
function useContextMenu() {
  const [menu, setMenu] = useState(null);
  const open = (e, items) => { e.preventDefault(); e.stopPropagation(); setMenu({ x: e.clientX, y: e.clientY, items }); };
  const node = menu ? <ContextMenu {...menu} onClose={() => setMenu(null)} /> : null;
  return [open, node];
}

/* ============================================================
   Modal — centered dialog with scrim, focus-trap-lite, Esc
   ============================================================ */
function Modal({ title, icon, children, onClose, actions, width = 420 }) {
  useEffect(() => {
    const esc = (e) => e.key === "Escape" && onClose && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: "var(--z-modal)", background: "rgba(0,0,0,0.35)",
      display: "flex", alignItems: "center", justifyContent: "center" }}
      onPointerDown={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} className="bevel-out"
        onPointerDown={(e) => e.stopPropagation()}
        style={{ width, maxWidth: "92vw", background: "var(--surface)", padding: 3,
          boxShadow: "var(--win-shadow)", animation: "win-open 0.16s ease-out" }}>
        <WindowHeader icon={icon} title={title} active onClose={onClose} />
        <div style={{ padding: "var(--sp-4)", fontSize: 14 }}>{children}</div>
        {actions && <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "0 var(--sp-4) var(--sp-4)" }}>{actions}</div>}
      </div>
    </div>
  );
}

/* ============================================================
   DesktopIcon — double-click to open, selectable
   ============================================================ */
function DesktopIcon({ icon, label, selected, onOpen, onSelect, onContextMenu }) {
  return (
    <button
      className="focus-ring no-select"
      onClick={(e) => { e.stopPropagation(); onSelect && onSelect(); }}
      onDoubleClick={onOpen}
      onContextMenu={onContextMenu}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, width: 76,
        padding: "6px 4px", background: "transparent", border: "1px dotted transparent", cursor: "pointer",
        borderColor: selected ? "var(--desktop-text)" : "transparent" }}>
      <span style={{ fontSize: 30, lineHeight: 1, filter: "drop-shadow(1px 1px 0 rgba(0,0,0,0.5))",
        background: selected ? "rgba(0,0,128,0.4)" : "transparent", padding: 2 }}>{icon}</span>
      <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--desktop-text)", textAlign: "center",
        textShadow: "1px 1px 0 rgba(0,0,0,0.7)", lineHeight: 1.15,
        background: selected ? "var(--selection-bg)" : "transparent", padding: selected ? "1px 3px" : 0 }}>{label}</span>
    </button>
  );
}

/* ============================================================
   ProgressBar — chunky segmented (boot + stats)
   ============================================================ */
function ProgressBar({ value = 0, segmented = true }) {
  return (
    <div className="bevel-in" style={{ height: 20, background: "var(--surface-2)", padding: 2, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${value}%`, transition: "width 0.2s",
        background: segmented
          ? "repeating-linear-gradient(90deg, var(--accent) 0 10px, transparent 10px 13px)"
          : "var(--accent)" }} />
    </div>
  );
}

/* ---- export everything for other Babel files ---- */
Object.assign(window, {
  cx, RetroButton, RetroCard, GroupBox, WindowHeader, SysBtn, RetroWindow,
  Tabs, Tooltip, ContextMenu, useContextMenu, Modal, DesktopIcon, ProgressBar,
});
