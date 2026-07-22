import { getDbArticleCount, getDbArticles } from "@/lib/dbArticles";
import { apiError, apiSuccess } from "@/lib/api/response";
import { serializeArticle } from "@/lib/api/serializers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_LIMIT = 50;
// `category` is derived from free-text keywords, not a stored column (see
// getArticleCategory in dbArticles.ts), so filtering by it means fetching
// every article and filtering in memory rather than pushing a WHERE clause
// to the DB. Fine at hundreds of articles; if the table grows into the
// thousands this should become a real `category` column instead.
const CATEGORY_SCAN_LIMIT = 2000;

/**
 * GET /api/v1/articles?limit=20&offset=0&category=authentication
 * Newest first. `category` matches the same value returned in each article's
 * `category` field (case-insensitive) — Authentication, Jordan, Yeezy,
 * Market, or the generic Article bucket everything else falls into.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const limitParam = Number(searchParams.get("limit") ?? "20");
  const offsetParam = Number(searchParams.get("offset") ?? "0");
  const category = searchParams.get("category")?.trim().toLowerCase() || null;

  if (!Number.isFinite(limitParam) || limitParam < 1) {
    return apiError("`limit` must be a positive number.", 400);
  }

  if (!Number.isFinite(offsetParam) || offsetParam < 0) {
    return apiError("`offset` must be zero or a positive number.", 400);
  }

  const limit = Math.min(limitParam, MAX_LIMIT);

  if (category) {
    const allArticles = await getDbArticles(CATEGORY_SCAN_LIMIT);
    const matches = allArticles.filter(
      (article) => article.category.toLowerCase() === category,
    );
    const page = matches.slice(offsetParam, offsetParam + limit);

    return apiSuccess(
      { articles: page.map(serializeArticle) },
      {
        limit,
        offset: offsetParam,
        count: page.length,
        total: matches.length,
        category,
        hasMore: offsetParam + page.length < matches.length,
      },
      120,
    );
  }

  const [articles, total] = await Promise.all([
    getDbArticles(limit, offsetParam),
    getDbArticleCount(),
  ]);

  return apiSuccess(
    { articles: articles.map(serializeArticle) },
    {
      limit,
      offset: offsetParam,
      count: articles.length,
      total,
      category: null,
      hasMore: offsetParam + articles.length < total,
    },
    120,
  );
}
