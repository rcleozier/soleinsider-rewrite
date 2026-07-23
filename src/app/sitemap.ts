import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { brandDirectory } from "@/lib/brands";
import { siteUrl } from "@/lib/siteData";

// Regenerated hourly rather than on every crawl hit — the full product/article
// scan is cheap but there's no reason to re-run it per request.
export const revalidate = 3600;

const STATIC_PATHS = [
  { path: "/", priority: 1, changeFrequency: "hourly" as const },
  { path: "/articles", priority: 0.8, changeFrequency: "hourly" as const },
  { path: "/calendar", priority: 0.8, changeFrequency: "daily" as const },
  { path: "/brands", priority: 0.6, changeFrequency: "weekly" as const },
  { path: "/sports", priority: 0.6, changeFrequency: "hourly" as const },
  { path: "/on-this-day", priority: 0.5, changeFrequency: "daily" as const },
  { path: "/search", priority: 0.3, changeFrequency: "weekly" as const },
  { path: "/app", priority: 0.3, changeFrequency: "monthly" as const },
  { path: "/terms", priority: 0.1, changeFrequency: "yearly" as const },
  { path: "/privacy", priority: 0.1, changeFrequency: "yearly" as const },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, articles] = await Promise.all([
    prisma.product.findMany({
      select: { id: true, slug: true, updatedAt: true },
      orderBy: { id: "desc" },
    }),
    prisma.article.findMany({
      select: { slug: true, updatedAt: true, createdAt: true },
      orderBy: { id: "desc" },
    }),
  ]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map(({ path, priority, changeFrequency }) => ({
    url: `${siteUrl}${path}`,
    changeFrequency,
    priority,
  }));

  const brandEntries: MetadataRoute.Sitemap = brandDirectory.map((brand) => ({
    url: `${siteUrl}${brand.href ?? `/brands/${brand.slug}`}`,
    changeFrequency: "daily",
    priority: 0.5,
  }));

  const productEntries: MetadataRoute.Sitemap = products
    .filter((product) => product.slug)
    .map((product) => ({
      url: `${siteUrl}/${product.slug}/${product.id}`,
      lastModified: product.updatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

  const articleEntries: MetadataRoute.Sitemap = articles
    .filter((article) => article.slug)
    .map((article) => ({
      url: `${siteUrl}/article/${article.slug}`,
      lastModified: article.updatedAt ?? article.createdAt ?? undefined,
      changeFrequency: "monthly",
      priority: 0.6,
    }));

  return [...staticEntries, ...brandEntries, ...productEntries, ...articleEntries];
}
