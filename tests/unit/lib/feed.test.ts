import { describe, expect, it } from "vitest";
import { escapeXml, publishedPosts, rssXml } from "@lib/feed";

const post = (slug: string, date: string, draft = false) => ({
  slug,
  title: `Post ${slug}`,
  date: new Date(date),
  draft,
});

describe("publishedPosts", () => {
  const posts = [post("old", "2026-01-01"), post("draft", "2026-06-01", true), post("new", "2026-03-01")];

  it("drops drafts and sorts newest first", () => {
    expect(publishedPosts(posts, false).map((p) => p.slug)).toEqual(["new", "old"]);
  });

  it("keeps drafts when asked, for local previews", () => {
    expect(publishedPosts(posts, true).map((p) => p.slug)).toEqual(["draft", "new", "old"]);
  });
});

describe("rssXml", () => {
  const channel = {
    title: "Writing & notes",
    description: "Notes from <RETRO//OS>",
    site: "https://example.com/",
    self: "https://example.com/rss.xml",
  };

  it("escapes text and links each post to its page", () => {
    const xml = rssXml(channel, [{ ...post("hello", "2026-05-29"), description: 'A "quoted" & <tagged> line' }]);
    expect(xml).toContain("<title>Writing &amp; notes</title>");
    expect(xml).toContain("<description>Notes from &lt;RETRO//OS&gt;</description>");
    expect(xml).toContain("<link>https://example.com/posts/hello/</link>");
    expect(xml).toContain('<guid isPermaLink="true">https://example.com/posts/hello/</guid>');
    expect(xml).toContain("<pubDate>Fri, 29 May 2026 00:00:00 GMT</pubDate>");
    expect(xml).toContain("<description>A &quot;quoted&quot; &amp; &lt;tagged&gt; line</description>");
  });

  it("is a valid empty channel with no posts", () => {
    const xml = rssXml(channel, []);
    expect(xml).not.toContain("<item>");
    expect(xml).toContain('<atom:link href="https://example.com/rss.xml" rel="self" type="application/rss+xml" />');
  });

  it("leaves plain text alone", () => {
    expect(escapeXml("plain")).toBe("plain");
  });
});
