/**
 * Content collections, validated at build time against src/content/schema.ts.
 * The browser gets the same data through src/content/vite-plugin.ts.
 */
import { file, glob } from "astro/loaders";
import { defineCollection } from "astro:content";
import { postSchema, profileSchema, projectSchema, skillGroupSchema } from "./content/schema";

const projects = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/projects" }),
  schema: projectSchema,
});

const posts = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/posts" }),
  schema: postSchema,
});

const profile = defineCollection({ loader: file("src/content/profile.json"), schema: profileSchema });

const skills = defineCollection({ loader: file("src/content/skills.json"), schema: skillGroupSchema });

export const collections = { projects, posts, profile, skills };
