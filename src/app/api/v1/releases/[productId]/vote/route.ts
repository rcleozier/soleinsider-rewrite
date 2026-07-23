import { getAuthenticatedMember } from "@/lib/apiAuth";
import { getDbReleaseById, getDbVoteSummary } from "@/lib/dbReleases";
import { apiError, apiSuccess } from "@/lib/api/response";
import { castVote, getMemberVote, type VoteStatus } from "@/lib/releaseSocial";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteProps = {
  params: Promise<{ productId: string }>;
};

function isVoteStatus(value: unknown): value is VoteStatus {
  return value === "cop" || value === "drop";
}

/** GET /api/v1/releases/{productId}/vote — the current member's cop/drop vote on this release, if any. */
export async function GET(request: Request, { params }: RouteProps) {
  const member = await getAuthenticatedMember(request);

  if (!member) {
    return apiError("Sign in to see your vote.", 401);
  }

  const { productId } = await params;
  const numericId = Number.parseInt(productId, 10);

  if (!Number.isFinite(numericId)) {
    return apiError("Invalid product id.", 400);
  }

  const vote = await getMemberVote(member.id, numericId);

  return apiSuccess({ vote });
}

/**
 * POST /api/v1/releases/{productId}/vote
 * Body: { "status": "cop" | "drop" }
 * Replaces any prior vote this member cast on this release — one active
 * vote per member per release, not a running tally of every click.
 */
export async function POST(request: Request, { params }: RouteProps) {
  const member = await getAuthenticatedMember(request);

  if (!member) {
    return apiError("Sign in to vote.", 401);
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

  let status: unknown;

  try {
    const body = await request.json();
    status = body?.status;
  } catch {
    return apiError("Expected a JSON body with a `status` field.", 400);
  }

  if (!isVoteStatus(status)) {
    return apiError('`status` must be "cop" or "drop".', 400);
  }

  await castVote(member.id, numericId, status);

  const summary = await getDbVoteSummary(productId);

  return apiSuccess({ vote: status, summary });
}
