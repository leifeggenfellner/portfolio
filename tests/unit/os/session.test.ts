import { expect, it } from "vitest";
import { parseSession } from "@lib/os/session";

const box = { x: 10, y: 20, w: 400, h: 300 };

it("keeps valid windows and drops malformed ones and apps that no longer exist", () => {
  const raw = JSON.stringify([
    { appId: "terminal", box, layout: { kind: "snapped", side: "left", restore: box }, minimized: false },
    { appId: "gone", box, layout: { kind: "floating" } },
    { appId: "about", box: { x: "10" } },
    { appId: "projects", box, args: { project: "retro-os", junk: 3 }, layout: { kind: "maximized" }, minimized: true },
  ]);
  expect(parseSession(raw, ["terminal", "about", "projects"])).toEqual([
    {
      appId: "terminal",
      args: undefined,
      box,
      layout: { kind: "snapped", side: "left", restore: box },
      minimized: false,
    },
    {
      appId: "projects",
      args: { project: "retro-os" },
      box,
      layout: { kind: "maximized", previous: { kind: "floating" } },
      minimized: true,
    },
  ]);
  expect(parseSession("{not json", ["terminal"])).toEqual([]);
  expect(parseSession('{"appId":"terminal"}', ["terminal"])).toEqual([]);
});
