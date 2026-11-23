/**
 * schema.org JSON-LD for search engines: who the site is about, each project
 * and each post. Pages pass these to RootLayout, which writes them into a
 * `<script type="application/ld+json">`.
 */
import type { Profile } from "@content/profile";
import type { Project } from "@content/schema";

type JsonLd = Record<string, unknown>;

const CONTEXT = "https://schema.org";

export function personLd(profile: Profile, site: URL): JsonLd {
  return {
    "@context": CONTEXT,
    "@type": "Person",
    "@id": new URL("#person", site).href,
    name: profile.name,
    jobTitle: profile.role,
    url: site.href,
    ...(profile.location ? { address: { "@type": "PostalAddress", addressLocality: profile.location } } : {}),
    sameAs: profile.links.map((link) => link.url),
  };
}

export function websiteLd(name: string, site: URL): JsonLd {
  return {
    "@context": CONTEXT,
    "@type": "WebSite",
    name,
    url: site.href,
    author: { "@id": new URL("#person", site).href },
  };
}

/** Source code when there is a repository, otherwise a creative work. */
export function projectLd(project: Project, page: URL, site: URL): JsonLd {
  return {
    "@context": CONTEXT,
    "@type": project.repo ? "SoftwareSourceCode" : "CreativeWork",
    name: project.name,
    headline: project.tagline,
    description: project.summary,
    url: page.href,
    dateCreated: String(project.year),
    author: { "@id": new URL("#person", site).href },
    keywords: project.tech.join(", "),
    ...(project.repo ? { codeRepository: project.repo } : {}),
    ...(project.cover ? { image: new URL(project.cover, site).href } : {}),
  };
}

export function postLd(post: { title: string; date: Date; description?: string }, page: URL, site: URL): JsonLd {
  return {
    "@context": CONTEXT,
    "@type": "BlogPosting",
    headline: post.title,
    datePublished: post.date.toISOString(),
    url: page.href,
    author: { "@id": new URL("#person", site).href },
    ...(post.description ? { description: post.description } : {}),
  };
}

/** Safe inside a <script>: a `<` in any string could otherwise close it. */
export function serializeJsonLd(data: JsonLd | readonly JsonLd[]): string {
  return JSON.stringify(data).replaceAll("<", "\\u003c");
}
