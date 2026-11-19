/**
 * Content collections — typed at build time.
 *
 * Astro 6 requires explicit loaders for each collection.
 * `projects` uses the glob loader for JSON files.
 * `posts` uses the glob loader for MDX files.
 */
import { glob } from "astro/loaders";
import { defineCollection } from "astro:content";
import { z } from "zod";
import { projectSchema } from "./content/schema";

const projects = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/projects" }),
  schema: projectSchema,
});

const posts = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/posts" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { projects, posts };
