import { describe, expect, it } from "vitest";
import { mailtoUrl } from "@lib/mailto";

describe("mailtoUrl", () => {
  it("encodes subject and body and signs with the sender's name", () => {
    expect(mailtoUrl("me@example.com", { subject: "Hi & bye", message: " Line one\nline two ", from: "Ada" })).toBe(
      "mailto:me@example.com?subject=Hi%20%26%20bye&body=Line%20one%0Aline%20two%0A%0AAda",
    );
  });

  it("leaves out empty fields", () => {
    expect(mailtoUrl("me@example.com", { subject: " ", message: "hello there", from: "" })).toBe(
      "mailto:me@example.com?body=hello%20there",
    );
    expect(mailtoUrl("me@example.com", { subject: "", message: "", from: "" })).toBe("mailto:me@example.com");
  });
});
