import { describe, expect, it } from "vitest";
import { pixelPaths } from "@lib/pixel";

describe("pixelPaths", () => {
  it("merges horizontal runs into one rectangle per run, grouped by colour", () => {
    const paths = pixelPaths(["aa.b", ".aaa"]);
    expect(paths.get("a")).toBe("M0 0h2v1h-2zM1 1h3v1h-3z");
    expect(paths.get("b")).toBe("M3 0h1v1h-1z");
  });

  it("treats dots and spaces as transparent", () => {
    expect([...pixelPaths([". ."]).keys()]).toEqual([]);
  });
});
