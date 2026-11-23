/**
 * A read-only, in-memory filesystem for the terminal. The Terminal app builds
 * the tree from site content; this module only knows how to walk it.
 *
 * Paths are arrays of segments from the root, so "/home/leif" is
 * ["home", "leif"] and the root itself is [].
 */

export interface FsFile {
  kind: "file";
  lines: string[];
  /** App the `open` command launches for this file. */
  opens?: string;
}

export interface FsDir {
  kind: "dir";
  children: Record<string, FsNode>;
}

export type FsNode = FsFile | FsDir;

export function dir(children: Record<string, FsNode>): FsDir {
  return { kind: "dir", children };
}

export function file(lines: string[], opens?: string): FsFile {
  return opens ? { kind: "file", lines, opens } : { kind: "file", lines };
}

export function nodeAt(root: FsDir, segments: readonly string[]): FsNode | undefined {
  let node: FsNode = root;
  for (const segment of segments) {
    if (node.kind !== "dir") return undefined;
    const next: FsNode | undefined = node.children[segment];
    if (!next) return undefined;
    node = next;
  }
  return node;
}

/**
 * Resolve `path` against `cwd`, handling "~", ".", ".." and absolute paths.
 * The result may not exist; check it with `nodeAt`.
 */
export function resolvePath(cwd: readonly string[], home: readonly string[], path: string): string[] {
  let segments: string[];
  let rest = path;
  if (rest === "~" || rest.startsWith("~/")) {
    segments = [...home];
    rest = rest.slice(1);
  } else if (rest.startsWith("/")) {
    segments = [];
  } else {
    segments = [...cwd];
  }
  for (const part of rest.split("/")) {
    if (part === "" || part === ".") continue;
    if (part === "..") segments.pop();
    else segments.push(part);
  }
  return segments;
}

/** Display form of a path, with the home directory shortened to "~". */
export function formatPath(segments: readonly string[], home: readonly string[]): string {
  const inHome = home.length > 0 && home.every((part, i) => segments[i] === part);
  if (inHome) {
    const rest = segments.slice(home.length);
    return rest.length ? `~/${rest.join("/")}` : "~";
  }
  return `/${segments.join("/")}`;
}

/** Child names of a directory, folders first, each sorted. Folders end in "/". */
export function listDir(node: FsDir): string[] {
  const entries = Object.entries(node.children);
  const dirs = entries.filter(([, child]) => child.kind === "dir").map(([name]) => `${name}/`);
  const files = entries.filter(([, child]) => child.kind === "file").map(([name]) => name);
  return [...dirs.sort(), ...files.sort()];
}
