import { generateArticles } from "@/lib/articleGenerator";
import type { ArticleCategory } from "@/lib/articleTopics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Text + image generation runs sequentially per article, so give it room.
export const maxDuration = 300;

const categories: ArticleCategory[] = ["sports", "authentication", "lifestyle"];

export async function GET(request: Request) {
  return runCron(request);
}

export async function POST(request: Request) {
  return runCron(request);
}

async function runCron(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const countParam = Number(searchParams.get("count") ?? "2");
  const categoryParam = searchParams.get("category");

  const count = Number.isFinite(countParam) ? Math.min(Math.max(countParam, 1), 5) : 2;
  const category =
    categoryParam && categories.includes(categoryParam as ArticleCategory)
      ? (categoryParam as ArticleCategory)
      : undefined;

  const startedAt = Date.now();

  try {
    const results = await generateArticles({ count, category });
    const created = results.filter((result) => result.success);
    const failed = results.filter((result) => !result.success);

    return Response.json({
      success: true,
      requested: count,
      created: created.length,
      failed: failed.length,
      articles: created.map((result) => ({
        slug: result.success ? result.slug : null,
        subject: result.topic.subject,
        angle: result.topic.angle,
        category: result.topic.category,
      })),
      errors: failed.map((result) => ({
        subject: result.topic.subject,
        error: result.success ? null : result.error,
      })),
      durationMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Article generation failed.",
        durationMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

function isAuthorizedCronRequest(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return true;
  }

  return (
    request.headers.get("x-cron-secret") === secret ||
    request.headers.get("authorization") === `Bearer ${secret}`
  );
}
