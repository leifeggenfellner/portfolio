<script lang="ts">
  import { cx } from "@lib/cx";
  import type { Snippet } from "svelte";

  type Variant = "default" | "primary" | "ghost" | "icon";
  type Size = "sm" | "md" | "lg" | "icon";

  interface Props {
    variant?: Variant;
    size?: Size;
    active?: boolean;
    disabled?: boolean;
    class?: string;
    children?: Snippet;
    [key: string]: unknown;
  }

  let {
    variant = "default",
    size = "md",
    active = false,
    disabled = false,
    class: className,
    children,
    ...rest
  }: Props = $props();

  let pressed = $state(false);

  const sizeMap: Record<Size, string> = {
    sm: "min-h-[22px] px-2 py-[2px] text-13",
    md: "min-h-[28px] px-4 py-[5px] text-14",
    lg: "min-h-[36px] px-5 py-2 text-16",
    icon: "h-[26px] w-[26px] p-0 text-14",
  };

  const isIcon = $derived(variant === "icon" || size === "icon");
  const showPressed = $derived((pressed || active) && variant !== "ghost");

  const buttonClass = $derived(
    cx(
      "focus-ring no-select font-body inline-flex items-center justify-center gap-1 leading-none font-semibold whitespace-nowrap",
      variant !== "ghost" && "bevel-out",
      showPressed && "bevel-pressed",
      variant === "primary" && "text-white",
      variant === "primary" && "bg-[linear-gradient(var(--accent-soft),var(--accent))]",
      variant === "ghost" && "bg-transparent",
      variant === "default" && "bg-surface text-text",
      isIcon ? sizeMap.icon : sizeMap[size],
      disabled && "cursor-default opacity-55",
      !disabled && "cursor-pointer",
      className,
    ),
  );

  function release() {
    pressed = false;
  }
</script>

<button
  type="button"
  aria-pressed={active}
  {disabled}
  class={buttonClass}
  onpointerdown={() => {
    if (disabled) return;
    pressed = true;
    window.addEventListener("pointerup", release, { once: true });
  }}
  onpointerup={() => {
    pressed = false;
  }}
  onpointerleave={() => {
    pressed = false;
  }}
  {...rest}
>
  <span class={cx("inline-flex items-center gap-1", showPressed && "translate-x-px translate-y-px")}>
    {@render children?.()}
  </span>
</button>
