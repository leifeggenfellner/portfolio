import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import Settings from "@apps/settings/App.svelte";
import { createOs, osContext } from "@lib/os/context";
import { DEFAULT_SETTINGS } from "@lib/settings";

// The form is generated from the schema, so one pass covers every kind of control.
describe("Settings app", () => {
  it("drives every setting from its control and resets them", async () => {
    const user = userEvent.setup();
    const os = createOs();
    render(Settings, { props: { shell: { apps: [], open() {}, close() {} } }, context: osContext(os) });

    await user.click(screen.getByRole("radio", { name: "Dark" }));
    await user.click(screen.getByRole("checkbox", { name: "Play boot animation" }));
    await user.click(screen.getByRole("checkbox", { name: "Pixel-art cursors" }));
    expect(os.settings.current).toMatchObject({ theme: "dark", bootAnimation: false, cursors: "system" });

    await user.click(screen.getByRole("button", { name: "Reset to defaults" }));
    expect(os.settings.current).toEqual(DEFAULT_SETTINGS);
    expect(screen.getByRole("radio", { name: "Light" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Pixel-art cursors" })).toBeChecked();
  });
});
