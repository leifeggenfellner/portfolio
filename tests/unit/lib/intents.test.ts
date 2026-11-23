import { describe, expect, it } from "vitest";
import { intents } from "@lib/store/intents";

describe("intents", () => {
  it("hands a request to the first taker only", () => {
    intents.showProject("retro-os");
    expect(intents.take("project")).toBe("retro-os");
    expect(intents.take("project")).toBeNull();
  });

  it("keeps kinds apart", () => {
    intents.runInTerminal("neofetch");
    expect(intents.take("project")).toBeNull();
    expect(intents.take("terminal")).toBe("neofetch");
  });
});
