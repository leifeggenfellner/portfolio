/**
 * The service worker from the page's side: register it (production only),
 * and notice when a new build is waiting so the taskbar can offer it. The
 * worker itself is src/pwa/sw.js.
 */
export class Updates {
  /** A new build is installed and waiting for the page to switch over. */
  ready = $state(false);
  #waiting: ServiceWorker | null = null;

  /** Register the worker; returns the function that stops listening. */
  register(url: string, scope: string): () => void {
    if (!("serviceWorker" in navigator)) return () => {};
    let stopped = false;
    const offer = (worker: ServiceWorker | null) => {
      // Only an update: the first install has nothing to replace.
      if (stopped || !worker || !navigator.serviceWorker.controller) return;
      this.#waiting = worker;
      this.ready = true;
    };
    void navigator.serviceWorker.register(url, { scope }).then((registration) => {
      offer(registration.waiting);
      registration.addEventListener("updatefound", () => {
        const installing = registration.installing;
        installing?.addEventListener("statechange", () => {
          if (installing.state === "installed") offer(installing);
        });
      });
    });
    return () => (stopped = true);
  }

  /** Switch to the waiting build and reload into it. */
  apply(): void {
    if (!this.#waiting) return;
    navigator.serviceWorker.addEventListener("controllerchange", () => location.reload(), { once: true });
    this.#waiting.postMessage("skip-waiting");
  }
}
