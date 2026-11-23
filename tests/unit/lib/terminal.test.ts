import { describe, expect, it, vi } from "vitest";
import { dir, file, formatPath, listDir, nodeAt, resolvePath } from "@lib/terminal/fs";
import { complete, execute, prompt, tokenize } from "@lib/terminal/shell";
import type { ShellContext } from "@lib/terminal/shell";

const root = dir({
  home: dir({
    guest: dir({
      "about.txt": file(["hello."]),
      projects: dir({ "retro-os.prj": file(["Retro"], "projects"), "radio.prj": file(["Radio"]) }),
    }),
  }),
  etc: dir({ motd: file(["welcome"]) }),
});
const home = ["home", "guest"];

function context(overrides: Partial<ShellContext> = {}): ShellContext {
  return {
    root,
    home,
    cwd: home,
    user: "guest",
    host: "retro",
    history: ["ls", "cat about.txt"],
    apps: [
      { id: "projects", title: "Projects" },
      { id: "minigame", title: "Minesweeper" },
    ],
    whoami: ["Guest User", "engineer"],
    neofetch: [["OS", "RetroOS"]],
    actions: {
      open: vi.fn(),
      setTheme: vi.fn(),
      setCrt: vi.fn(),
      setGridSpeed: vi.fn(),
      exit: vi.fn(),
      panic: vi.fn(),
    },
    random: () => 0,
    now: () => new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

const texts = (input: string, ctx = context()) => execute(input, ctx).lines.map((l) => l.text);

describe("terminal filesystem", () => {
  it("resolves relative, absolute, home and parent paths", () => {
    expect(resolvePath(home, home, "projects")).toEqual([...home, "projects"]);
    expect(resolvePath(home, home, "../..")).toEqual([]);
    expect(resolvePath([], home, "~/projects/./")).toEqual([...home, "projects"]);
    expect(resolvePath(home, home, "/etc/motd")).toEqual(["etc", "motd"]);
    expect(resolvePath([], home, "..")).toEqual([]);
  });

  it("finds nodes and refuses to walk through files", () => {
    expect(nodeAt(root, ["etc", "motd"])?.kind).toBe("file");
    expect(nodeAt(root, ["etc", "motd", "x"])).toBeUndefined();
    expect(nodeAt(root, ["nope"])).toBeUndefined();
  });

  it("formats paths relative to home and lists folders first", () => {
    expect(formatPath(home, home)).toBe("~");
    expect(formatPath([...home, "projects"], home)).toBe("~/projects");
    expect(formatPath(["etc"], home)).toBe("/etc");
    expect(listDir(nodeAt(root, home) as never)).toEqual(["projects/", "about.txt"]);
  });
});

describe("terminal shell", () => {
  it("tokenizes quoted arguments", () => {
    expect(tokenize(`echo "hello  world" 'x' y`)).toEqual(["echo", "hello  world", "x", "y"]);
  });

  it("shows the prompt with the current directory", () => {
    expect(prompt(context())).toBe("guest@retro:~$");
    expect(prompt(context({ cwd: ["etc"] }))).toBe("guest@retro:/etc$");
  });

  it("lists, changes directory and prints files", () => {
    expect(texts("ls")).toEqual(["projects/  about.txt"]);
    expect(execute("cd projects", context()).cwd).toEqual([...home, "projects"]);
    expect(execute("cd", context({ cwd: [] })).cwd).toEqual(home);
    expect(texts("cat about.txt /etc/motd")).toEqual(["hello.", "welcome"]);
    expect(texts("pwd")).toEqual(["/home/guest"]);
  });

  it("reports errors for missing paths and wrong kinds", () => {
    expect(execute("cd nowhere", context()).lines[0]?.tone).toBe("err");
    expect(texts("cd about.txt")[0]).toContain("not a directory");
    expect(texts("cat projects")[0]).toContain("is a directory");
    expect(texts("frobnicate")[0]).toContain("command not found");
  });

  it("opens apps by id, title or through a file", () => {
    const ctx = context();
    execute("open Projects", ctx);
    execute("open projects/retro-os.prj", ctx);
    execute("open minesweeper", ctx);
    expect(ctx.actions.open).toHaveBeenNthCalledWith(1, "projects");
    expect(ctx.actions.open).toHaveBeenNthCalledWith(2, "projects");
    expect(ctx.actions.open).toHaveBeenNthCalledWith(3, "minigame");
    expect(execute("open projects/radio.prj", ctx).lines[0]?.tone).toBe("err");
  });

  it("changes settings only to allowed values", () => {
    const ctx = context();
    execute("theme dark", ctx);
    execute("crt full", ctx);
    execute("grid paused", ctx);
    expect(ctx.actions.setTheme).toHaveBeenCalledWith("dark");
    expect(ctx.actions.setCrt).toHaveBeenCalledWith("full");
    expect(ctx.actions.setGridSpeed).toHaveBeenCalledWith("paused");
    expect(texts("theme neon", ctx)[0]).toBe("usage: theme <light|dark>");
    expect(ctx.actions.setTheme).toHaveBeenCalledTimes(1);
  });

  it("clears, exits, numbers history and answers easter eggs", () => {
    const ctx = context();
    expect(execute("clear", ctx).clear).toBe(true);
    execute("exit", ctx);
    expect(ctx.actions.exit).toHaveBeenCalled();
    expect(texts("history")).toEqual(["   1  ls", "   2  cat about.txt"]);
    expect(execute("sudo rm -rf /", ctx).lines[0]?.tone).toBe("dim");
  });

  it("tells fortunes from the injected random source", () => {
    expect(texts("fortune", context({ random: () => 0 }))).toHaveLength(1);
    expect(texts("fortune", context({ random: () => 0 }))).not.toEqual(
      texts("fortune", context({ random: () => 0.99 })),
    );
  });

  it("lets the monitor speak, with a joke when given nothing to say", () => {
    expect(texts("cowsay hi there").join("\n")).toContain("< hi there >");
    expect(texts("cowsay").join("\n")).toContain("wrong animal");
  });

  it("asks the terminal for the matrix effect", () => {
    expect(execute("matrix", context()).effect).toBe("matrix");
    expect(execute("cmatrix", context()).effect).toBe("matrix");
  });

  it("prints a manual page for every listed command", () => {
    for (const name of ["ls", "cd", "cat", "open", "theme", "fortune", "man"]) {
      const page = texts(`man ${name}`);
      expect(page[0]).toBe(`${name.toUpperCase()}(1)`);
      expect(page.length).toBeGreaterThan(3);
    }
    expect(execute("man", context()).lines[0]?.tone).toBe("err");
    expect(texts("man nope")).toEqual(["no manual entry for nope"]);
    expect(texts("man panic")).toEqual(["no manual entry for panic"]);
  });

  it("keeps the train and the rain out of help", () => {
    expect(texts("sl").join("\n")).toContain("you meant 'ls'");
    const help = texts("help").join("\n");
    for (const name of ["fortune", "cowsay", "matrix", "man"]) expect(help).toContain(name);
    for (const name of ["sl", "cmatrix", "panic"]) expect(help).not.toMatch(new RegExp(`^  ${name} `, "m"));
  });

  it("panics on request, without listing panic in help or completion", () => {
    const ctx = context();
    expect(execute("panic", ctx).lines[0]?.tone).toBe("err");
    expect(ctx.actions.panic).toHaveBeenCalledTimes(1);
    expect(texts("help").join("\n")).not.toContain("panic");
    expect(complete("pan", ctx).input).toBe("pan");
  });

  it("lists every command in help", () => {
    const help = texts("help").join("\n");
    for (const name of ["ls", "cd", "cat", "open", "theme", "exit"]) expect(help).toContain(name);
  });
});

describe("terminal completion", () => {
  it("completes a unique command and adds a space", () => {
    expect(complete("neo", context())).toEqual({ input: "neofetch ", options: [] });
  });

  it("extends to the common prefix and lists options when ambiguous", () => {
    const { input, options } = complete("c", context());
    expect(input).toBe("c");
    expect(options).toEqual(expect.arrayContaining(["cat", "cd", "clear", "crt"]));
  });

  it("completes paths, keeping the directory prefix", () => {
    expect(complete("cat proj", context()).input).toBe("cat projects/");
    expect(complete("cat projects/re", context()).input).toBe("cat projects/retro-os.prj ");
    const { input, options } = complete("cat projects/", context());
    expect(input).toBe("cat projects/r");
    expect(options).toEqual(["radio.prj", "retro-os.prj"]);
  });

  it("completes app ids for open and values for settings", () => {
    expect(complete("open mini", context()).input).toBe("open minigame ");
    expect(complete("theme d", context()).input).toBe("theme dark ");
  });

  it("completes command names after man, and knows the new commands", () => {
    expect(complete("man fort", context()).input).toBe("man fortune ");
    expect(complete("cow", context()).input).toBe("cowsay ");
    expect(complete("mat", context()).input).toBe("matrix ");
  });

  it("leaves the input alone when nothing matches", () => {
    expect(complete("zzz", context())).toEqual({ input: "zzz", options: [] });
  });
});
