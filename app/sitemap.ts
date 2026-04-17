import type { MetadataRoute } from "next";
import { blogPosts, featurePages } from "@/lib/seo-content";
import { SITE_URL } from "@/lib/site";

const staticPublicRoutes = [
  "",
  "/features",
  "/blog",
  "/use-cases",
  "/privacy",
  "/terms",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticEntries = staticPublicRoutes.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : 0.8,
  }));

  const featureEntries = featurePages.map((feature) => ({
    url: `${SITE_URL}/features/${feature.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.75,
  }));

  const blogEntries = blogPosts.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: post.date,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticEntries, ...featureEntries, ...blogEntries];
}
