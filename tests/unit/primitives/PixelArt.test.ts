import { render } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import PixelArt from "@primitives/PixelArt.svelte";

describe("PixelArt", () => {
  it("draws one path per colour, scaled to the requested size and hidden from assistive tech", () => {
    const { container } = render(PixelArt, {
      props: { rows: ["ab", "a."], palette: { a: "red" }, size: 32 },
    });
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("viewBox", "0 0 2 2");
    expect(svg).toHaveAttribute("width", "32");
    expect(svg).toHaveAttribute("height", "32");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    const fills = [...container.querySelectorAll("path")].map((p) => p.getAttribute("fill"));
    expect(fills).toEqual(["red", "currentColor"]);
  });

  it("keeps the aspect ratio of wide sprites", () => {
    const { container } = render(PixelArt, { props: { rows: ["aaaa", "aaaa"], palette: {}, size: 16 } });
    expect(container.querySelector("svg")).toHaveAttribute("height", "8");
  });
});
