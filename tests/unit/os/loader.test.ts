import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Loader } from "@lib/os/loader.svelte";
import type { LoadTask } from "@lib/os/loader.svelte";

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

/** A task that ends when the test says so. */
function deferred(id: string, blocking = true) {
  let finish!: (value?: { done: number; total: number }) => void;
  let fail!: (error: Error) => void;
  let report!: Parameters<LoadTask["run"]>[0];
  const task: LoadTask = {
    id,
    label: id,
    blocking,
    run: (r) => {
      report = r;
      return new Promise((resolve, reject) => {
        finish = resolve;
        fail = reject;
      });
    },
  };
  return {
    task,
    finish: (v?: { done: number; total: number }) => finish(v),
    fail: (e: Error) => fail(e),
    report: (p: Parameters<typeof report>[0]) => report(p),
  };
}

const line = (loader: Loader, id: string) => loader.lines.find((l) => l.id === id);

describe("Loader", () => {
  it("shows progress live, settles when the blocking tasks end, and leaves the rest in the background", async () => {
    const loader = new Loader();
    const apps = deferred("apps");
    const offline = deferred("offline", false);
    const settled = loader.run([apps.task, offline.task], 3000);

    apps.report({ done: 2, total: 7, bytes: 100 });
    expect(line(loader, "apps")).toMatchObject({ status: "run", done: 2, total: 7, bytes: 100 });

    apps.finish({ done: 7, total: 7 });
    await settled;
    expect(loader.settled).toBe(true);
    expect(line(loader, "apps")).toMatchObject({ status: "ok", done: 7 });
    expect(line(loader, "offline")?.status).toBe("bg");
  });

  it("marks a failed task ERR and carries on", async () => {
    const loader = new Loader();
    const fonts = deferred("fonts");
    const apps = deferred("apps");
    const settled = loader.run([fonts.task, apps.task], 3000);
    fonts.fail(new Error("offline"));
    apps.finish();
    await settled;
    expect(line(loader, "fonts")?.status).toBe("err");
    expect(line(loader, "apps")?.status).toBe("ok");
  });

  it("goes on at the deadline and lets late work finish in the background", async () => {
    const loader = new Loader();
    const apps = deferred("apps");
    const settled = loader.run([apps.task], 3000);
    await vi.advanceTimersByTimeAsync(3000);
    await settled;
    expect(loader.settled).toBe(true);
    expect(line(loader, "apps")?.status).toBe("bg");

    // Progress doesn't pull it out of the background; finishing does.
    apps.report({ done: 5, total: 7 });
    expect(line(loader, "apps")?.status).toBe("bg");
    apps.finish({ done: 7, total: 7 });
    await vi.runAllTimersAsync();
    expect(line(loader, "apps")?.status).toBe("ok");
  });
});
