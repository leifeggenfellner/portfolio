import { expect, it } from "vitest";
import { serializeJsonLd } from "@lib/structured-data";

it("keeps JSON-LD from closing its script tag", () => {
  const out = serializeJsonLd({ name: "</script><script>alert(1)</script>" });
  expect(out).not.toContain("<");
  expect(JSON.parse(out)).toEqual({ name: "</script><script>alert(1)</script>" });
});
