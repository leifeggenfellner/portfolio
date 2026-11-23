import { readdirSync, readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import type { Project } from "../../src/content/schema";

// src/content/projects.ts uses Vite's import.meta.glob, which Playwright doesn't have.
const PROJECTS_DIR = new URL("../../src/content/projects/", import.meta.url);
const PROJECTS: Project[] = readdirSync(PROJECTS_DIR)
  .filter((name) => name.endsWith(".json"))
  .map((name) => JSON.parse(readFileSync(new URL(name, PROJECTS_DIR), "utf8")) as Project);

const SITE = "https://eggenfellner.no";
const APP_ROUTES = [
  ["/about/", "Me.txt — Notepad"],
  ["/projects/", "Projects"],
  ["/terminal/", "Terminal"],
  ["/skills/", "Skills Matrix"],
  ["/contact/", "Contact"],
  ["/minesweeper/", "Minesweeper"],
  ["/settings/", "Settings"],
] as const;

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("every app and project page renders its window, content and metadata", async ({ page }) => {
    for (const [path, title] of APP_ROUTES) {
      await page.goto(path);
      await expect(page.getByRole("dialog", { name: title })).toBeVisible();
      await expect(page).toHaveTitle(`${title} · RETRO//OS`);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `${SITE}${path}`);
    }
    for (const project of PROJECTS) {
      await page.goto(`/projects/${project.slug}/`);
      await expect(
        page.getByRole("dialog", { name: "Projects" }).getByRole("heading", { name: project.name }),
      ).toBeVisible();
      await expect(page).toHaveTitle(`${project.name} · RETRO//OS`);
      expect(await page.locator('meta[name="description"]').getAttribute("content")).toContain(project.tagline);
      const ld = await page.locator('script[type="application/ld+json"]').textContent();
      expect(JSON.parse(ld ?? "[]")).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ "@type": "Person" }),
          expect.objectContaining({
            "@type": project.repo ? "SoftwareSourceCode" : "CreativeWork",
            name: project.name,
          }),
        ]),
      );
    }
  });

  test("the desktop is there, and its icons are links to each app", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Terminal" }).click();
    await expect(page).toHaveURL(/\/terminal\/$/);
    await expect(page.getByRole("dialog", { name: "Terminal" })).toContainText("retro-sh");
  });
});

test.describe("app pages with JavaScript", () => {
  test("open straight to the desktop with the window, no boot", async ({ page }) => {
    await page.goto("/projects/retro-os/");
    const explorer = page.getByRole("dialog", { name: "Projects" });
    await expect(explorer.getByRole("heading", { name: "Retro" })).toBeVisible();
    await expect(page.locator("astro-island[ssr]")).toHaveCount(0);
    await expect(explorer.getByRole("button", { name: "Back" })).toBeEnabled();
  });

  test("an app page and a post have no axe violations, contrast included", async ({ page }) => {
    for (const path of ["/about/", "/posts/"]) {
      await page.goto(path);
      await expect(page.locator("astro-island[ssr]")).toHaveCount(0);
      // Finite animations only: the desktop's grid and cursor blink loop forever.
      await page.waitForFunction(() =>
        document.getAnimations().every((a) => a.effect?.getComputedTiming().iterations === Infinity),
      );
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
    }
  });
});

test("the feed and sitemap list every page", async ({ request }) => {
  const rss = await request.get("/rss.xml");
  expect(rss.ok()).toBe(true);
  const xml = await rss.text();
  expect(xml).toContain('<rss version="2.0"');
  // The only post is a draft, so it stays out.
  expect(xml).not.toContain("hello-retro");

  const sitemap = await (await request.get("/sitemap-0.xml")).text();
  for (const path of ["/posts/", ...APP_ROUTES.map(([p]) => p), ...PROJECTS.map((p) => `/projects/${p.slug}/`)]) {
    expect(sitemap).toContain(`<loc>${SITE}${path}</loc>`);
  }
  expect(sitemap).not.toContain("hello-retro");
});
