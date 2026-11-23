import { getCollection } from "astro:content";
import { publishedPosts, rssXml } from "@lib/feed";
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ site }) => {
  const base = import.meta.env.BASE_URL;
  const root = new URL(base, site).toString();
  const entries = await getCollection("posts");
  const posts = publishedPosts(
    entries.map((entry) => ({ slug: entry.id, ...entry.data })),
    false,
  );
  const xml = rssXml(
    {
      title: "RETRO//OS writing",
      description: "Notes on building RETRO//OS and other things.",
      site: root,
      self: new URL("rss.xml", root).toString(),
    },
    posts,
  );
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
};
