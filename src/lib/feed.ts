/**
 * Writing helpers shared by the post pages and the RSS feed. Pure, so the
 * feed's XML can be tested without a build.
 */

export interface FeedPost {
  slug: string;
  title: string;
  date: Date;
  description?: string;
  draft: boolean;
}

/** Published posts, newest first. Drafts stay out of production builds. */
export function publishedPosts<T extends FeedPost>(posts: readonly T[], includeDrafts: boolean): T[] {
  return posts.filter((post) => includeDrafts || !post.draft).sort((a, b) => b.date.getTime() - a.date.getTime());
}

const XML_ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" };

export function escapeXml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => XML_ESCAPES[char] ?? char);
}

export interface FeedChannel {
  title: string;
  description: string;
  /** Absolute URL of the site root. */
  site: string;
  /** Absolute URL of the feed itself. */
  self: string;
}

/** An RSS 2.0 document for `posts`, linking each to `<site>posts/<slug>/`. */
export function rssXml(channel: FeedChannel, posts: readonly FeedPost[]): string {
  const items = posts.map((post) => {
    const link = new URL(`posts/${post.slug}/`, channel.site).toString();
    return [
      "    <item>",
      `      <title>${escapeXml(post.title)}</title>`,
      `      <link>${link}</link>`,
      `      <guid isPermaLink="true">${link}</guid>`,
      `      <pubDate>${post.date.toUTCString()}</pubDate>`,
      ...(post.description ? [`      <description>${escapeXml(post.description)}</description>`] : []),
      "    </item>",
    ].join("\n");
  });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${escapeXml(channel.title)}</title>`,
    `    <link>${channel.site}</link>`,
    `    <description>${escapeXml(channel.description)}</description>`,
    "    <language>en</language>",
    `    <atom:link href="${channel.self}" rel="self" type="application/rss+xml" />`,
    ...items,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");
}
