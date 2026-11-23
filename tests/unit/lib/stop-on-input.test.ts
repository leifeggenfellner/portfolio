import { describe, expect, it, vi } from "vitest";
import { stopOnInput } from "@lib/stop-on-input";

describe("stopOnInput", () => {
  it("stops once, on the first key or click, and swallows it", () => {
    const onStop = vi.fn();
    const target = new EventTarget();
    stopOnInput(onStop, target);
    const key = new KeyboardEvent("keydown", { cancelable: true });
    target.dispatchEvent(key);
    target.dispatchEvent(new Event("pointerdown", { cancelable: true }));
    expect(onStop).toHaveBeenCalledTimes(1);
    expect(key.defaultPrevented).toBe(true);
  });

  it("can be cancelled before any input", () => {
    const onStop = vi.fn();
    const target = new EventTarget();
    const cancel = stopOnInput(onStop, target);
    cancel();
    target.dispatchEvent(new Event("keydown"));
    expect(onStop).not.toHaveBeenCalled();
  });
});
