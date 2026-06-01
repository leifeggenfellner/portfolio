/**
 * RetroWindow — draggable, resizable, focusable frame.
 *
 * Controlled: position/size/z come from props (typically the
 * window-manager store). Standalone use is fine for tests.
 *
 * Accessibility: role="dialog" + aria-label, focus delegated
 * to children, ESC handled by app contents (not here).
 *
 * NOTE: `position: absolute` + numeric px is the OS metaphor.
 * On mobile, the shell switches to a single fullscreen view
 * and bypasses dragging entirely (see <Desktop />).
 */
import { useCallback, useRef, type ReactNode, type CSSProperties } from "react";
import { cx } from "@lib/cx";
import { WindowHeader } from "./WindowHeader";

export interface RetroWindowProps {
  title: string;
  icon?: string;
  children: ReactNode;
  active?: boolean;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  z?: number;
  minimized?: boolean;
  maximized?: boolean;
  resizable?: boolean;
  noChrome?: boolean;
  statusbar?: ReactNode | ReactNode[];
  style?: CSSProperties;
  onFocus?: () => void;
  onMove?: (x: number, y: number) => void;
  onResize?: (w: number, h: number) => void;
  onMin?: () => void;
  onMax?: () => void;
  onClose?: () => void;
}

export function RetroWindow({
  title,
  icon,
  children,
  active = true,
  x = 40,
  y = 40,
  w = 420,
  h,
  z = 100,
  minimized,
  maximized,
  resizable = true,
  noChrome,
  statusbar,
  style,
  onFocus,
  onMove,
  onResize,
  onMin,
  onMax,
  onClose,
}: RetroWindowProps) {
  const winRef = useRef<HTMLDivElement>(null);

  const startDrag = useCallback(
    (e: React.PointerEvent) => {
      if (maximized) return;
      onFocus?.();
      const sx = e.clientX,
        sy = e.clientY;
      const ox = x,
        oy = y;
      const move = (ev: PointerEvent) => {
        onMove?.(ox + (ev.clientX - sx), Math.max(0, oy + (ev.clientY - sy)));
      };
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    },
    [x, y, maximized, onFocus, onMove],
  );

  const startResize = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      onFocus?.();
      const el = winRef.current;
      if (!el) return;
      const sx = e.clientX,
        sy = e.clientY;
      const ow = el.offsetWidth,
        oh = el.offsetHeight;
      const move = (ev: PointerEvent) => {
        onResize?.(Math.max(260, ow + (ev.clientX - sx)), Math.max(160, oh + (ev.clientY - sy)));
      };
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    },
    [onFocus, onResize],
  );

  if (minimized) return null;

  const frame: CSSProperties = maximized
    ? { left: 0, top: 0, width: "100%", height: "calc(100% - 2px)" }
    : { left: x, top: y, width: w, height: h };

  return (
    <div
      ref={winRef}
      role="dialog"
      aria-label={title}
      className={cx("bevel-out absolute flex flex-col p-[3px]")}
      onPointerDown={() => onFocus?.()}
      style={{
        ...frame,
        zIndex: z,
        background: "var(--surface)",
        boxShadow: active ? "var(--shadow-window)" : "2px 2px 0 rgba(0,0,0,.18)",
        animation: "win-open var(--duration-2) var(--ease-out)",
        ...style,
      }}
    >
      {!noChrome && (
        <WindowHeader
          icon={icon}
          title={title}
          active={active}
          maximized={maximized}
          onPointerDown={startDrag}
          onMin={onMin}
          onMax={onMax}
          onClose={onClose}
        />
      )}
      <div
        className={cx(
          "bevel-in retro-scroll bg-surface-3 flex min-h-0 flex-1 flex-col overflow-hidden",
          !noChrome && "mt-[2px]",
        )}
      >
        {children}
      </div>
      {statusbar && (
        <div className="bevel-in-thin bg-surface text-12 text-text-dim mt-[3px] flex gap-3.5 px-1.5 py-[2px]">
          {Array.isArray(statusbar) ? statusbar.map((s, i) => <span key={i}>{s}</span>) : statusbar}
        </div>
      )}
      {resizable && !maximized && (
        <button
          type="button"
          aria-label="Resize window"
          onPointerDown={startResize}
          className="absolute right-0 bottom-0 h-4 w-4 cursor-nwse-resize border-0 bg-transparent p-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, var(--bevel-shadow) 0 1px, transparent 1px 3px)",
          }}
        />
      )}
    </div>
  );
}
