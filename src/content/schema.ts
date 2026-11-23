/**
 * One schema per kind of content. The content collections validate the
 * files with these at build time (src/content.config.ts), and so does the
 * Vite plugin that hands the same data to the browser
 * (src/content/vite-plugin.ts). Apps import only the types, so zod never
 * reaches the client bundle.
 */
import { z } from "zod";

export const projectSchema = z.object({
  slug: z.string(),
  name: z.string(),
  tagline: z.string(),
  year: z.number(),
  role: z.string(),
  tech: z.array(z.string()),
  repo: z.url().optional(),
  url: z.url().optional(),
  featured: z.boolean().default(false),
  summary: z.string(),
  /** Cover image under public/, e.g. "/projects/retro-os.png": shown on the project page and used as its social preview (1200x630). */
  cover: z.string().startsWith("/").optional(),
  coverAlt: z.string().optional(),
});

export type Project = z.infer<typeof projectSchema>;

/** One line of the CV: a job, or a stint at a school. */
const timelineEntrySchema = z.object({
  /** "2025" or "2022–2024"; "now" for ongoing. */
  when: z.string(),
  title: z.string(),
  org: z.string(),
  /** Tools or focus, kept to a few words. */
  note: z.string().optional(),
});

/**
 * Who the site belongs to. About, Terminal and Contact all read it.
 * `null` marks something not supplied yet; each app leaves it out rather than
 * inventing a stand-in. Placeholder copy is flagged with `placeholder: true`
 * so it can be found and replaced.
 */
export const profileSchema = z.object({
  name: z.string(),
  /** Terminal user name. */
  handle: z.string(),
  role: z.string(),
  location: z.string().nullable(),
  bio: z.object({ paragraphs: z.array(z.string()), placeholder: z.boolean() }),
  experience: z.array(timelineEntrySchema),
  education: z.array(timelineEntrySchema),
  email: z.email().nullable(),
  links: z.array(z.object({ label: z.string(), url: z.url() })),
});

export type Profile = z.infer<typeof profileSchema>;

/**
 * A Skills Matrix group. Each skill names where it can be seen in practice,
 * so the matrix is evidence rather than self-rating; there are no percentages.
 */
export const skillGroupSchema = z.object({
  name: z.string(),
  skills: z.array(z.object({ name: z.string(), evidence: z.string() })),
});

/** @public Used by the virtual:content/skills declaration (src/content/virtual.d.ts), which knip doesn't follow. */
export type SkillGroup = z.infer<typeof skillGroupSchema>;

export const postSchema = z.object({
  title: z.string(),
  date: z.coerce.date(),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
});

/** Featured first, then newest, then by name: the order every project list uses. */
export function sortProjects(projects: readonly Project[]): Project[] {
  return [...projects].sort(
    (a, b) => Number(b.featured) - Number(a.featured) || b.year - a.year || a.name.localeCompare(b.name),
  );
}
