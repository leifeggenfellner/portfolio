/**
 * WindowHeader — title bar with system buttons (min/max/close).
 *
 * - Drag is delegated: parent passes `onPointerDown` for the
 *   drag handle. System buttons stop propagation so they don't
 *   start a drag.
 * - Double-click toggles maximize.
 * - The gradient flips when `active` is false so background
 *   windows visibly recede.
 */
import { RetroButton } from "./RetroButton";

export interface WindowHeaderProps {
  icon?: string;
  title: string;
  active?: boolean;
  maximized?: boolean;
  onPointerDown?: (e: React.PointerEvent) => void;
  onMin?: () => void;
  onMax?: () => void;
  onClose?: () => void;
}

export function WindowHeader({
  icon,
  title,
  active = true,
  maximized,
  onPointerDown,
  onMin,
  onMax,
  onClose,
}: WindowHeaderProps) {
  return (
    <div
      className="no-select chrome flex h-7 cursor-move items-center gap-1.5 px-1 py-[3px] pl-1.5"
      onPointerDown={onPointerDown}
      onDoubleClick={onMax}
      style={{
        background: active
          ? "linear-gradient(90deg, var(--title-active-from), var(--title-active-to))"
          : "linear-gradient(90deg, var(--title-inactive-from), var(--title-inactive-to))",
        color: active ? "var(--title-active-text)" : "var(--title-inactive-text)",
      }}
    >
      {icon && (
        <span
          className="text-15 leading-none"
          style={{ filter: active ? undefined : "grayscale(1) opacity(.6)" }}
          aria-hidden
        >
          {icon}
        </span>
      )}
      <span
        className="text-15 flex-1 overflow-hidden text-ellipsis whitespace-nowrap"
        style={{ textShadow: active ? "1px 1px 0 rgba(0,0,0,.35)" : undefined }}
      >
        {title}
      </span>
      <div className="flex gap-[3px]" onPointerDown={(e) => e.stopPropagation()}>
        {onMin && (
          <SysBtn label="Minimize" onClick={onMin}>
            <span style={{ marginTop: 6 }}>▁</span>
          </SysBtn>
        )}
        {onMax && (
          <SysBtn label={maximized ? "Restore" : "Maximize"} onClick={onMax}>
            {maximized ? "❐" : "▢"}
          </SysBtn>
        )}
        {onClose && (
          <SysBtn label="Close" onClick={onClose}>
            ✕
          </SysBtn>
        )}
      </div>
    </div>
  );
}

function SysBtn({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <RetroButton
      variant="icon"
      aria-label={label}
      title={label}
      onClick={onClick}
      style={{ width: 22, height: 20, fontSize: 12, fontWeight: 700, color: "var(--text)" }}
    >
      <span className="font-body leading-none">{children}</span>
    </RetroButton>
  );
}
