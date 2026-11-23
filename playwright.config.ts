import { defineConfig, devices } from "@playwright/test";

const PORT = 4321;

export default defineConfig({
  testDir: "./tests/e2e",
  // One set of baselines for every machine: the visual project runs on one
  // engine with self-hosted fonts, and the threshold absorbs anti-aliasing.
  snapshotPathTemplate: "{testDir}/__screenshots__/{testFilePath}/{arg}{ext}",
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: "disabled", caret: "hide" } },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    // CI downloads the dist/ artifact from the build job. Locally, build first so
    // the suite never runs against a stale dist/ from an earlier build.
    command: (process.env.CI ? "" : "pnpm build && ") + "pnpm preview --port " + PORT,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    // Screenshots of the shared chrome, on one engine only (see visual.spec.ts).
    { name: "visual", testMatch: /visual\.spec\.ts/, use: { ...devices["Desktop Chrome"] } },
    { name: "chromium-desktop", testIgnore: /visual\.spec\.ts/, use: { ...devices["Desktop Chrome"] } },
    // Headless WebKit starves timers and animation frames when many instances
    // share the CPU, which made its tests flaky under full parallel load.
    { name: "webkit-desktop", testIgnore: /visual\.spec\.ts/, use: { ...devices["Desktop Safari"] }, workers: 2 },
    { name: "mobile-iphone", testIgnore: /visual\.spec\.ts/, use: { ...devices["iPhone 14"] }, workers: 2 },
    {
      name: "reduced-motion",
      testIgnore: /visual\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        contextOptions: { reducedMotion: "reduce" },
      },
    },
  ],
});
