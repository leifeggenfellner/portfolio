/**
 * useDrag — minimal pointer-based drag hook.
 * Returns a `onPointerDown` to spread on the drag handle.
 * Calls onMove with deltas relative to the drag start.
 * Respects pointer capture, releases on pointerup/cancel.
 */
import { useCallback, useRef } from "react";

interface DragOpts {
  onStart?: () => void;
  onMove: (dx: number, dy: number, ev: PointerEvent) => void;
  onEnd?: () => void;
}

export function useDrag({ onStart, onMove, onEnd }: DragOpts) {
  const origin = useRef<{ x: number; y: number } | null>(null);
  return useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      origin.current = { x: e.clientX, y: e.clientY };
      onStart?.();
      const move = (ev: PointerEvent) => {
        if (!origin.current) return;
        onMove(ev.clientX - origin.current.x, ev.clientY - origin.current.y, ev);
      };
      const up = () => {
        origin.current = null;
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", up);
        onEnd?.();
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", up);
    },
    [onStart, onMove, onEnd],
  );
}
