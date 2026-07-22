import { getBrandDefinition } from "@/lib/brands";
import { getDbReleasesByPatterns } from "@/lib/dbReleases";
import { apiError, apiSuccess } from "@/lib/api/response";
import { serializeBrand, serializeRelease } from "@/lib/api/serializers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_LIMIT = 200;

type RouteProps = {
  params: Promise<{ slug: string }>;
};

/**
 * GET /api/v1/brands/{slug}?limit=200
 * Every release matched against the brand's name patterns, newest first.
 * The target of every `links.api` emitted by /api/v1/brands.
 */
export async function GET(request: Request, { params }: RouteProps) {
  const { slug } = await params;
  const brand = getBrandDefinition(slug);

  if (!brand) {
    return apiError(`Brand "${slug}" was not found.`, 404);
  }

  const { searchParams } = new URL(request.url);
  const limitParam = Number(searchParams.get("limit") ?? String(MAX_LIMIT));

  if (!Number.isFinite(limitParam) || limitParam < 1) {
    return apiError("`limit` must be a positive number.", 400);
  }

  const limit = Math.min(limitParam, MAX_LIMIT);
  const releases = await getDbReleasesByPatterns(brand.patterns, limit);

  return apiSuccess(
    {
      brand: serializeBrand(brand),
      releases: releases.map((release) => serializeRelease(release)),
    },
    { limit, count: releases.length },
    300,
  );
}
