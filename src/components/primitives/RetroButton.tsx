/**
 * RetroButton — variant- and size-driven chunky beveled button.
 *
 * Variants:  default | primary | ghost | icon
 * Sizes:     sm | md | lg | icon
 *
 * Composition: `<RetroButton variant="primary">Open</RetroButton>`
 * Accessibility: native <button>, focus-visible dotted ring,
 * pressed state mirrored visually and via aria-pressed when
 * `active` is supplied (toggle pattern).
 */
import { useState, type ButtonHTMLAttributes } from "react";
import { cx } from "@lib/cx";

type Variant = "default" | "primary" | "ghost" | "icon";
type Size = "sm" | "md" | "lg" | "icon";

export interface RetroButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  active?: boolean;
}

const sizeMap: Record<Size, string> = {
  sm: "min-h-[22px] px-2 py-[2px] text-13",
  md: "min-h-[28px] px-4 py-[5px] text-14",
  lg: "min-h-[36px] px-5 py-2 text-16",
  icon: "h-[26px] w-[26px] p-0 text-14",
};

export function RetroButton({
  variant = "default",
  size = "md",
  active = false,
  disabled,
  className,
  children,
  onPointerDown,
  onPointerUp,
  onPointerLeave,
  ...rest
}: RetroButtonProps) {
  const [pressed, setPressed] = useState(false);
  const isIcon = variant === "icon" || size === "icon";
  const showPressed = (pressed || active) && variant !== "ghost";

  return (
    <button
      type="button"
      aria-pressed={active || undefined}
      disabled={disabled}
      className={cx(
        "focus-ring no-select font-body inline-flex items-center justify-center gap-1 leading-none font-semibold whitespace-nowrap",
        variant !== "ghost" && "bevel-out",
        showPressed && "bevel-pressed",
        variant === "primary" && "text-white",
        variant === "ghost" && "bg-transparent",
        variant === "default" && "bg-surface text-text",
        isIcon ? sizeMap.icon : sizeMap[size],
        disabled && "cursor-default opacity-55",
        !disabled && "cursor-pointer",
        className,
      )}
      style={
        variant === "primary"
          ? { background: "linear-gradient(var(--accent-soft), var(--accent))" }
          : undefined
      }
      onPointerDown={(e) => {
        if (!disabled) setPressed(true);
        onPointerDown?.(e);
      }}
      onPointerUp={(e) => {
        setPressed(false);
        onPointerUp?.(e);
      }}
      onPointerLeave={(e) => {
        setPressed(false);
        onPointerLeave?.(e);
      }}
      {...rest}
    >
      <span
        className="inline-flex items-center gap-1"
        style={{ transform: showPressed ? "translate(1px,1px)" : undefined }}
      >
        {children}
      </span>
    </button>
  );
}
