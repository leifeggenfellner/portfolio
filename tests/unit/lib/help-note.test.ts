import { afterEach, describe, expect, it, vi } from "vitest";
import { dismissHelpNote, HELP_NOTE_STORAGE_KEY, isHelpNoteDismissed } from "@lib/help-note";

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("help note persistence", () => {
  it("shows until dismissed, then stays dismissed", () => {
    expect(isHelpNoteDismissed()).toBe(false);
    dismissHelpNote();
    expect(localStorage.getItem(HELP_NOTE_STORAGE_KEY)).toBe("dismissed");
    expect(isHelpNoteDismissed()).toBe(true);
  });

  it("treats blocked storage as not dismissed and does not throw", () => {
    vi.spyOn(localStorage, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(localStorage, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => dismissHelpNote()).not.toThrow();
    expect(isHelpNoteDismissed()).toBe(false);
  });
});
