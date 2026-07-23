import { getAuthenticatedMember } from "@/lib/apiAuth";
import { getDbReleaseById } from "@/lib/dbReleases";
import { apiError, apiSuccess } from "@/lib/api/response";
import { createComment, listComments } from "@/lib/releaseSocial";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteProps = {
  params: Promise<{ productId: string }>;
};

/**
 * GET /api/v1/releases/{productId}/comments
 * Public — no auth required to read.
 */
export async function GET(_request: Request, { params }: RouteProps) {
  const { productId } = await params;
  const numericId = Number.parseInt(productId, 10);

  if (!Number.isFinite(numericId)) {
    return apiError("Invalid product id.", 400);
  }

  const comments = await listComments(numericId);

  return apiSuccess({ comments }, { count: comments.length }, 30);
}

/**
 * POST /api/v1/releases/{productId}/comments
 * Body: { "comment": "..." }
 * Requires auth (mobile bearer token or web session).
 */
export async function POST(request: Request, { params }: RouteProps) {
  const member = await getAuthenticatedMember(request);

  if (!member) {
    return apiError("Sign in to leave a comment.", 401);
  }

  const { productId } = await params;
  const numericId = Number.parseInt(productId, 10);

  if (!Number.isFinite(numericId)) {
    return apiError("Invalid product id.", 400);
  }

  const release = await getDbReleaseById(productId);

  if (!release) {
    return apiError(`Release "${productId}" was not found.`, 404);
  }

  let text: unknown;

  try {
    const body = await request.json();
    text = body?.comment;
  } catch {
    return apiError("Expected a JSON body with a `comment` field.", 400);
  }

  if (typeof text !== "string") {
    return apiError("`comment` is required.", 400);
  }

  try {
    const comment = await createComment(member.id, numericId, text);

    return apiSuccess({
      comment: {
        id: comment.id,
        productId: numericId,
        comment: comment.comment,
        author: member.name || "SoleInsider member",
        createdAt: comment.createdAt,
      },
    });
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "Unable to save comment.", 400);
  }
}
