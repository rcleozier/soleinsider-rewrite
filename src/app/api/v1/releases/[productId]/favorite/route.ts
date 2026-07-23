import { getAuthenticatedMember } from "@/lib/apiAuth";
import { getDbReleaseById } from "@/lib/dbReleases";
import { apiError, apiSuccess } from "@/lib/api/response";
import { addFavorite, isFavorited, removeFavorite } from "@/lib/releaseSocial";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteProps = {
  params: Promise<{ productId: string }>;
};

async function resolve(request: Request, productId: string) {
  const member = await getAuthenticatedMember(request);

  if (!member) {
    return { error: apiError("Sign in to favorite a release.", 401) } as const;
  }

  const numericId = Number.parseInt(productId, 10);

  if (!Number.isFinite(numericId)) {
    return { error: apiError("Invalid product id.", 400) } as const;
  }

  const release = await getDbReleaseById(productId);

  if (!release) {
    return { error: apiError(`Release "${productId}" was not found.`, 404) } as const;
  }

  return { memberId: member.id, productId: numericId } as const;
}

/** GET /api/v1/releases/{productId}/favorite — whether the current member has favorited this release. */
export async function GET(request: Request, { params }: RouteProps) {
  const resolved = await resolve(request, (await params).productId);

  if ("error" in resolved) {
    return resolved.error;
  }

  const favorited = await isFavorited(resolved.memberId, resolved.productId);

  return apiSuccess({ favorited });
}

/** POST /api/v1/releases/{productId}/favorite — add to favorites. Idempotent. */
export async function POST(request: Request, { params }: RouteProps) {
  const resolved = await resolve(request, (await params).productId);

  if ("error" in resolved) {
    return resolved.error;
  }

  await addFavorite(resolved.memberId, resolved.productId);

  return apiSuccess({ favorited: true });
}

/** DELETE /api/v1/releases/{productId}/favorite — remove from favorites. Idempotent. */
export async function DELETE(request: Request, { params }: RouteProps) {
  const resolved = await resolve(request, (await params).productId);

  if ("error" in resolved) {
    return resolved.error;
  }

  await removeFavorite(resolved.memberId, resolved.productId);

  return apiSuccess({ favorited: false });
}
