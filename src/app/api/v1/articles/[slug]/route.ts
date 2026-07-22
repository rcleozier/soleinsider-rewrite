import { getDbArticleBySlug, getDbArticles } from "@/lib/dbArticles";
import { apiError, apiSuccess } from "@/lib/api/response";
import { serializeArticle } from "@/lib/api/serializers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteProps = {
  params: Promise<{ slug: string }>;
};

/**
 * GET /api/v1/articles/{slug}
 * The target of every `links.api` emitted by /api/v1/articles.
 */
export async function GET(_request: Request, { params }: RouteProps) {
  const { slug } = await params;
  const article = await getDbArticleBySlug(slug);

  if (!article) {
    return apiError(`Article "${slug}" was not found.`, 404);
  }

  const related = await getRelatedArticles(article.slug, article.category, article.keywords);

  return apiSuccess(
    {
      article: serializeArticle(article),
      related: related.map(serializeArticle),
    },
    { relatedCount: related.length },
    300,
  );
}

/** Same category first, then shared-keyword matches, then whatever's left — excluding the article itself and never repeating a pick. */
async function getRelatedArticles(slug: string, category: string, keywords: string[]) {
  const pool = await getDbArticles(60);
  const others = pool.filter((candidate) => candidate.slug !== slug);
  const picked = new Set<string>();
  const ranked: typeof others = [];

  const buckets = [
    others.filter((candidate) => candidate.category.toLowerCase() === category.toLowerCase()),
    others.filter((candidate) => candidate.keywords.some((keyword) => keywords.includes(keyword))),
    others,
  ];

  for (const bucket of buckets) {
    for (const candidate of bucket) {
      if (!picked.has(candidate.slug)) {
        picked.add(candidate.slug);
        ranked.push(candidate);
      }
    }
  }

  return ranked.slice(0, 4);
}
