import { expect, test } from "@playwright/test";
import { openDesktop } from "./helpers";
import type { Locator } from "@playwright/test";

/**
 * Text drawn straight on the wallpaper sits over gradients, glows and CRT
 * scanlines, which axe reports as "incomplete" instead of measuring. This
 * measures it against the real pixels: hide the text, screenshot its box,
 * and take the worst contrast of its colour against every pixel behind it.
 * See docs/contrast-exceptions.md.
 */
async function worstContrast(text: Locator): Promise<number> {
  const color = await text.evaluate((node) => {
    let opacity = 1;
    for (let el: Element | null = node; el; el = el.parentElement) opacity *= Number(getComputedStyle(el).opacity);
    // Resolve any colour syntax (oklab, color-mix) to sRGB through a canvas.
    const ctx = document.createElement("canvas").getContext("2d")!;
    ctx.fillStyle = getComputedStyle(node).color;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    for (const el of [node, ...node.querySelectorAll("*")]) (el as HTMLElement).style.color = "transparent";
    return { r: r!, g: g!, b: b!, a: (a! / 255) * opacity };
  });
  const png = await text.screenshot();
  return text.page().evaluate(
    async ({ b64, fg }) => {
      const img = new Image();
      img.src = `data:image/png;base64,${b64}`;
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const px = ctx.getImageData(0, 0, img.width, img.height).data;
      const channel = (v: number) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
      const lum = (r: number, g: number, b: number) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
      let worst = Infinity;
      for (let i = 0; i < px.length; i += 4) {
        const [r, g, b] = [px[i]!, px[i + 1]!, px[i + 2]!];
        const text = lum(fg.r * fg.a + r * (1 - fg.a), fg.g * fg.a + g * (1 - fg.a), fg.b * fg.a + b * (1 - fg.a));
        const back = lum(r, g, b);
        worst = Math.min(worst, (Math.max(text, back) + 0.05) / (Math.min(text, back) + 0.05));
      }
      return worst;
    },
    { b64: png.toString("base64"), fg: color },
  );
}

for (const theme of ["light", "dark"]) {
  for (const crt of ["subtle", "full"]) {
    test(`text on the wallpaper keeps 4.5:1 (${theme}, CRT ${crt})`, async ({ page }, testInfo) => {
      test.skip(
        testInfo.project.name !== "chromium-desktop",
        "pixel measurement needs one engine and the desktop badge",
      );
      // A paused floor keeps the pixels still between the screenshot and the maths.
      await openDesktop(page, { settings: { theme, crt, gridSpeed: "paused" } });
      const badge = page.getByRole("complementary", { name: "System information" });
      for (const text of [
        badge.locator("p").nth(0),
        badge.locator("p").nth(1),
        badge.locator("p").nth(2),
        page.locator('[data-app-id="about"] span'),
      ]) {
        expect(await worstContrast(text)).toBeGreaterThanOrEqual(4.5);
      }
    });
  }
}
