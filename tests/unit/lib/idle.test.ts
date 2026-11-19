import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isDrafting, watchIdle } from "@lib/idle";

describe("watchIdle", () => {
  let target: EventTarget;
  beforeEach(() => {
    vi.useFakeTimers();
    target = new EventTarget();
  });
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("goes idle after the timeout and wakes on activity", () => {
    const onIdle = vi.fn();
    const onActive = vi.fn();
    const stop = watchIdle({ timeoutMs: 1000, onIdle, onActive, target });

    vi.advanceTimersByTime(999);
    expect(onIdle).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onIdle).toHaveBeenCalledTimes(1);

    target.dispatchEvent(new Event("keydown"));
    expect(onActive).toHaveBeenCalledTimes(1);
    stop();
  });

  it("restarts the countdown on every activity", () => {
    const onIdle = vi.fn();
    const stop = watchIdle({ timeoutMs: 1000, onIdle, onActive: vi.fn(), target });
    vi.advanceTimersByTime(800);
    target.dispatchEvent(new Event("pointermove"));
    vi.advanceTimersByTime(800);
    expect(onIdle).not.toHaveBeenCalled();
    vi.advanceTimersByTime(200);
    expect(onIdle).toHaveBeenCalledTimes(1);
    stop();
  });

  it("postpones while canIdle says no, and stops cleanly", () => {
    const onIdle = vi.fn();
    let allowed = false;
    const stop = watchIdle({ timeoutMs: 1000, onIdle, onActive: vi.fn(), canIdle: () => allowed, target });
    vi.advanceTimersByTime(1000);
    expect(onIdle).not.toHaveBeenCalled();
    allowed = true;
    vi.advanceTimersByTime(1000);
    expect(onIdle).toHaveBeenCalledTimes(1);

    stop();
    target.dispatchEvent(new Event("keydown"));
    vi.advanceTimersByTime(5000);
    expect(onIdle).toHaveBeenCalledTimes(1);
  });

  it("only reports activity once per idle period", () => {
    const onActive = vi.fn();
    const stop = watchIdle({ timeoutMs: 1000, onIdle: vi.fn(), onActive, target });
    target.dispatchEvent(new Event("keydown"));
    expect(onActive).not.toHaveBeenCalled();
    stop();
  });
});

describe("isDrafting", () => {
  it("is true only in a text field with something in it", () => {
    document.body.innerHTML = `<input id="t" /><input id="c" type="checkbox" /><textarea id="a">draft</textarea>`;
    const field = document.getElementById("t") as HTMLInputElement;
    field.focus();
    expect(isDrafting()).toBe(false);
    field.value = "half a thought";
    expect(isDrafting()).toBe(true);
    document.getElementById("c")?.focus();
    expect(isDrafting()).toBe(false);
    document.getElementById("a")?.focus();
    expect(isDrafting()).toBe(true);
  });
});
