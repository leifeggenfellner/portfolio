/**
 * RetroCard — compound: <RetroCard>, <RetroCard.Title>, <RetroCard.Body>
 *
 * A neutral container with raised or sunk bevels. Composition over
 * props: the title bar is opt-in and accepts a `right` slot.
 */
import { cx } from "@lib/cx";
import type { ReactNode, CSSProperties } from "react";

interface RetroCardProps {
  raised?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

export function RetroCard({ raised = true, className, style, children }: RetroCardProps) {
  return (
    <div className={cx(raised ? "bevel-out" : "bevel-in", "bg-surface", className)} style={style}>
      {children}
    </div>
  );
}

RetroCard.Title = function CardTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-bevel-shadow px-3 py-1.5 font-chrome text-15">
      <span>{children}</span>
      {right}
    </div>
  );
};

RetroCard.Body = function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("p-3", className)}>{children}</div>;
};
