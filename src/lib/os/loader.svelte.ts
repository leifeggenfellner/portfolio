/**
 * Runs loading work and keeps a live line per task for a log to show: the
 * BIOS on a first visit now, a heavy app's window later. Tasks run at once;
 * each reports its progress as it goes.
 *
 * Blocking tasks are what the caller waits for, but only until a deadline:
 * past it they carry on in the background, so a slow network can never hold
 * the screen. Anything still running when the caller moves on is marked as
 * in the background. A task that throws is marked ERR and the rest go on.
 */
import type { LineStatus, LogLine } from "@lib/boot-log";

export interface TaskProgress {
  done?: number;
  total?: number;
  bytes?: number;
  note?: string;
  /** How the task ended when it didn't simply succeed, e.g. "skip" on a phone. */
  status?: Extract<LineStatus, "ok" | "skip">;
}

export interface LoadTask {
  id: string;
  label: string;
  /** Waited for (up to the deadline) before `settled`. */
  blocking?: boolean;
  run: (report: (progress: TaskProgress) => void) => Promise<TaskProgress | void>;
}

export class Loader {
  lines = $state<LogLine[]>([]);
  /** Every blocking task has finished, failed, or gone to the background. */
  settled = $state(false);
  #deadline: ReturnType<typeof setTimeout> | undefined;

  /** Start `tasks`; resolves once settled. */
  run(tasks: readonly LoadTask[], deadlineMs: number): Promise<void> {
    clearTimeout(this.#deadline);
    this.settled = false;
    this.lines = tasks.map(({ id, label }) => ({ id, label, status: "run" }));

    const blocking = tasks.filter((task) => task.blocking).map((task) => this.#start(task));
    for (const task of tasks) if (!task.blocking) void this.#start(task);

    return new Promise((resolve) => {
      const settle = () => {
        clearTimeout(this.#deadline);
        // Whatever is still going carries on after the caller moves on.
        for (const line of this.lines) if (line.status === "run") line.status = "bg";
        this.settled = true;
        resolve();
      };
      this.#deadline = setTimeout(settle, deadlineMs);
      void Promise.all(blocking).then(() => {
        if (!this.settled) settle();
      });
    });
  }

  #line(id: string): LogLine | undefined {
    return this.lines.find((line) => line.id === id);
  }

  async #start(task: LoadTask): Promise<void> {
    const update = (patch: Partial<LogLine>) => {
      const line = this.#line(task.id);
      if (line) Object.assign(line, patch);
    };
    try {
      // Progress never sets the status: a line in the background stays there until it ends.
      const result = await task.run(({ status: _ignored, ...progress }) => update(progress));
      update({ ...result, status: result?.status ?? "ok" });
    } catch (error) {
      console.error(`Loading "${task.label}" failed`, error);
      update({ status: "err" });
    }
  }
}
