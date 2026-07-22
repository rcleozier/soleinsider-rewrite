import {
  getDbProductImages,
  getDbRelatedReleases,
  getDbReleaseById,
} from "@/lib/dbReleases";
import { apiError, apiSuccess } from "@/lib/api/response";
import { serializeRelease } from "@/lib/api/serializers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteProps = {
  params: Promise<{ productId: string }>;
};

/**
 * GET /api/v1/releases/{productId}
 * The target of every `links.api` emitted elsewhere in the API.
 */
export async function GET(_request: Request, { params }: RouteProps) {
  const { productId } = await params;
  const release = await getDbReleaseById(productId);

  if (!release) {
    return apiError(`Release "${productId}" was not found.`, 404);
  }

  const [gallery, related] = await Promise.all([
    getDbProductImages(release.product_id, release.image),
    getDbRelatedReleases(release, 8),
  ]);

  return apiSuccess(
    {
      // getDbProductImages already returns absolute URLs, so the serializer's
      // gallery is populated from the raw column instead.
      release: { ...serializeRelease(release), images: { primary: gallery[0] ?? "", gallery } },
      related: related.map((item) => serializeRelease(item)),
    },
    { relatedCount: related.length, galleryCount: gallery.length },
    300,
  );
}
