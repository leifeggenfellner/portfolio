import { expect, test } from "@playwright/test";
import { openApp, openDesktop } from "./helpers";

// The policy is a <meta> tag with Astro's hashes; a missing hash or an
// outside request would show up here as a violation.
test("no page breaks the Content Security Policy", async ({ page }) => {
  const violations: string[] = [];
  await page.addInitScript(() => {
    document.addEventListener("securitypolicyviolation", (e) => {
      (window as unknown as { __csp: string[] }).__csp ??= []; // a test-only global
      (window as unknown as { __csp: string[] }).__csp.push(`${e.violatedDirective} ${e.blockedURI}`); // same global
    });
  });
  page.on("console", (m) => {
    if (m.type() === "error" && /Content Security Policy/i.test(m.text())) violations.push(m.text());
  });

  await openDesktop(page);
  for (const app of ["about", "projects", "terminal", "skills", "contact", "minigame", "settings"]) {
    await openApp(page, app);
  }
  for (const path of ["/about/", "/projects/retro-os/", "/posts/"]) await page.goto(path);

  const recorded = await page.evaluate(() => (window as unknown as { __csp?: string[] }).__csp ?? []); // same global
  expect([...violations, ...recorded]).toEqual([]);
});
