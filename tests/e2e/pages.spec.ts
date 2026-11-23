import { readdirSync, readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { openApp, openDesktop } from "./helpers";
import type { Project } from "../../src/content/schema";

// src/content/projects.ts uses Vite's import.meta.glob, which Playwright doesn't have.
const PROJECTS_DIR = new URL("../../src/content/projects/", import.meta.url);
const PROJECTS: Project[] = readdirSync(PROJECTS_DIR)
  .filter((name) => name.endsWith(".json"))
  .map((name) => JSON.parse(readFileSync(new URL(name, PROJECTS_DIR), "utf8")) as Project);

const SITE = "https://eggenfellner.no";

test.describe("document pages", () => {
  test("every project in the explorer has a page with its own metadata", async ({ page }) => {
    for (const project of PROJECTS) {
      await page.goto(`/projects/${project.slug}/`);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(project.name);
      await expect(page).toHaveTitle(`${project.name} · RETRO//OS`);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `${SITE}/projects/${project.slug}/`);
      expect(await page.locator('meta[name="description"]').getAttribute("content")).toContain(project.tagline);
    }
  });

  for (const path of ["/projects/", "/projects/retro-os/", "/posts/", "/about/"]) {
    test(`${path} has no axe violations, contrast included`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
    });
  }

  test("the pages scroll, and lead back to the desktop", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 600 });
    await page.goto("/about/");
    // The desktop locks the viewport; document pages must not inherit that.
    const scroll = await page.evaluate(() => ({
      overflow: getComputedStyle(document.body).overflowY,
      tall: document.documentElement.scrollHeight > window.innerHeight,
    }));
    expect(scroll).toEqual({ overflow: "auto", tall: true });
    await page.getByRole("link", { name: "Open the desktop" }).click();
    await expect(page.getByRole("navigation", { name: "Taskbar" })).toBeVisible();
  });

  test("the feed and sitemap list the new pages", async ({ request }) => {
    const rss = await request.get("/rss.xml");
    expect(rss.ok()).toBe(true);
    const xml = await rss.text();
    expect(xml).toContain('<rss version="2.0"');
    // The only post is a draft, so it stays out.
    expect(xml).not.toContain("hello-retro");

    const sitemap = await (await request.get("/sitemap-0.xml")).text();
    for (const path of ["/about/", "/posts/", "/projects/", ...PROJECTS.map((p) => `/projects/${p.slug}/`)]) {
      expect(sitemap).toContain(`<loc>${SITE}${path}</loc>`);
    }
    expect(sitemap).not.toContain("hello-retro");
  });
});

test.describe("links from the desktop", () => {
  test("the explorer's project view links to the case study", async ({ page }) => {
    await openDesktop(page);
    const explorer = await openApp(page, "projects");
    await explorer.getByRole("button", { name: "retro-os.prj" }).dblclick();
    await expect(explorer.getByRole("link", { name: "Case study" })).toHaveAttribute("href", "/projects/retro-os/");
  });

  test("the Start menu opens the plain page", async ({ page }) => {
    await openDesktop(page);
    await page.getByRole("button", { name: "Start" }).click();
    await page.getByRole("menuitem", { name: "View as plain page" }).click();
    await expect(page).toHaveURL(/\/about\/$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
