/**
 * Schemas shared by the content collections (validated at build time) and the
 * apps that import the same files directly. Apps import only the types, so
 * zod never reaches the client bundle.
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
