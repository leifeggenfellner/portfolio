/**
 * Hands content to the browser as `virtual:content/profile`, `/skills` and
 * `/projects`: the same files the collections read, validated with the same
 * schemas, so invalid content fails the build. Each module ends up only in
 * the chunks that import it (an app's, the palette's), never in the desktop's.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { profileSchema, projectSchema, skillGroupSchema, sortProjects } from "./schema";

const PREFIX = "virtual:content/";
const DIR = new URL(".", import.meta.url).pathname;

const read = (path: string): unknown => JSON.parse(readFileSync(join(DIR, path), "utf8"));

function check<T>(schema: { parse(value: unknown): T }, value: unknown, where: string): T {
  try {
    return schema.parse(value);
  } catch (error) {
    throw new Error(`Invalid content in src/content/${where}: ${String(error)}`, { cause: error });
  }
}

const MODULES: Record<string, () => { files: string[]; code: string }> = {
  profile: () => {
    const { me } = read("profile.json") as { me: unknown };
    return {
      files: ["profile.json"],
      code: `export const PROFILE = ${JSON.stringify(check(profileSchema, me, "profile.json"))};`,
    };
  },
  skills: () => {
    const groups = (read("skills.json") as unknown[]).map((g, i) => check(skillGroupSchema, g, `skills.json [${i}]`));
    return { files: ["skills.json"], code: `export const SKILL_GROUPS = ${JSON.stringify(groups)};` };
  },
  projects: () => {
    const files = readdirSync(join(DIR, "projects"))
      .filter((name) => name.endsWith(".json"))
      .map((name) => `projects/${name}`);
    const projects = files.map((path) => check(projectSchema, read(path), path));
    return { files, code: `export const PROJECTS = ${JSON.stringify(sortProjects(projects))};` };
  },
};

/** The slice of a Vite plugin this needs; `vite` itself is only a dependency of Astro's. */
interface ContentPlugin {
  name: string;
  resolveId(id: string): string | undefined;
  load(this: { addWatchFile(path: string): void }, id: string): string | undefined;
}

export function contentData(): ContentPlugin {
  return {
    name: "content-data",
    resolveId: (id) => (id.startsWith(PREFIX) && id.slice(PREFIX.length) in MODULES ? `\0${id}` : undefined),
    load(id) {
      if (!id.startsWith(`\0${PREFIX}`)) return;
      const build = MODULES[id.slice(PREFIX.length + 1)];
      if (!build) return;
      const { files, code } = build();
      for (const path of files) this.addWatchFile(join(DIR, path));
      return code;
    },
  };
}
