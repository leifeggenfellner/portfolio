/**
 * What the BIOS log reports on a first visit: the machine as the browser
 * sees it, what the page loaded (bytes from Resource Timing), the fonts, the
 * app code it fetches ahead of time (desktop only: phones load an app when
 * it opens), and the service worker filling the offline cache.
 */
import { MOBILE_QUERY } from "./viewport.svelte";
import type { Launcher } from "./launcher.svelte";
import type { LoadTask, TaskProgress } from "./loader.svelte";

const SCRIPT = /\/_astro\/[^?#]+\.js(?:[?#]|$)/;
const STYLE = /\/_astro\/[^?#]+\.css(?:[?#]|$)/;
const FONT = /\/_astro\/[^?#]+\.woff2?(?:[?#]|$)/;

/** Files the page has fetched whose URL matches, started at or after `since` (ms after navigation). */
function fetched(match: RegExp, since = 0): { count: number; bytes: number } {
  const entries = performance
    .getEntriesByType("resource")
    .filter((entry) => entry.startTime >= since && match.test(entry.name)) as PerformanceResourceTiming[];
  return { count: entries.length, bytes: entries.reduce((sum, entry) => sum + entry.encodedBodySize, 0) };
}

/** A task that reports files the page already fetched. */
function loaded(id: string, label: string, match: RegExp): LoadTask {
  return {
    id,
    label,
    run: async () => {
      const { count, bytes } = fetched(match);
      return { done: count, total: count, bytes };
    },
  };
}

function detected(id: string, label: string, note: () => string): LoadTask {
  return { id, label, run: async () => ({ note: note() }) };
}

/** Download every app's code, counting files and bytes as they land. */
function prefetchApps(launcher: Launcher): LoadTask {
  return {
    id: "apps",
    label: "Loading apps",
    blocking: true,
    run: async (report) => {
      // Read now, not from the Viewport service: the boot can start before it listens.
      if (window.matchMedia(MOBILE_QUERY).matches) return { status: "skip", note: "on demand" };
      const since = performance.now();
      const total = launcher.apps.length;
      let done = 0;
      const progress = (): TaskProgress => ({
        done,
        total,
        bytes: fetched(SCRIPT, since).bytes + fetched(STYLE, since).bytes,
      });
      report(progress());
      await Promise.all(
        launcher.apps.map(async (app) => {
          await launcher.prefetch(app.id);
          done += 1;
          report(progress());
        }),
      );
      return progress();
    },
  };
}

/** Fonts the page uses, once the browser has them. */
const fonts: LoadTask = {
  id: "fonts",
  label: "Loading fonts",
  blocking: true,
  run: async () => {
    await document.fonts.ready;
    // Astro adds a metric-matched fallback face per font; those aren't downloads.
    const faces = [...document.fonts].filter((face) => face.status === "loaded" && !/fallback/i.test(face.family));
    return { done: faces.length, total: faces.length, bytes: fetched(FONT).bytes };
  },
};

/**
 * The service worker posts `{ type: "precache", done, total }` as it caches
 * each file on install (src/pwa/sw.js). Not blocking: it carries on after the
 * boot, and the log shows how far it got.
 */
const offline: LoadTask = {
  id: "offline",
  label: "Caching for offline",
  run: (report) => {
    if (!import.meta.env.PROD || !("serviceWorker" in navigator)) {
      return Promise.resolve({ status: "skip", note: "unavailable" });
    }
    if (navigator.serviceWorker.controller) return Promise.resolve({ note: "ready" });
    return new Promise((resolve) => {
      const onMessage = (event: MessageEvent) => {
        const { type, done, total } = (event.data ?? {}) as { type?: string; done?: number; total?: number };
        if (type !== "precache" || done === undefined || total === undefined) return;
        report({ done, total });
        if (done < total) return;
        navigator.serviceWorker.removeEventListener("message", onMessage);
        resolve({ done, total });
      };
      navigator.serviceWorker.addEventListener("message", onMessage);
    });
  },
};

export function bootTasks(launcher: Launcher, { crt }: { crt: string }): LoadTask[] {
  return [
    detected("cpu", "Detecting CPU", () => `${navigator.hardwareConcurrency || 1} cores`),
    detected("display", "Detecting display", () => `${screen.width}x${screen.height}, CRT ${crt}`),
    loaded("kernel", "Loading kernel", SCRIPT),
    loaded("styles", "Loading styles", STYLE),
    fonts,
    prefetchApps(launcher),
    offline,
  ];
}
