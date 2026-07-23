import { getAuthenticatedMember } from "@/lib/apiAuth";
import { apiError, apiSuccess } from "@/lib/api/response";
import { getMemberComments, getMemberFavorites, getMemberVotes } from "@/lib/memberProfile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/v1/me
 * Requires auth (mobile bearer token or web session). The single call the
 * mobile app's profile screen needs: who's logged in, what they've
 * favorited, how they voted, and what they've commented.
 */
export async function GET(request: Request) {
  const member = await getAuthenticatedMember(request);

  if (!member) {
    return apiError("Sign in required.", 401);
  }

  const [favorites, votes, comments] = await Promise.all([
    getMemberFavorites(member.id),
    getMemberVotes(member.id),
    getMemberComments(member.id),
  ]);

  return apiSuccess({
    user: member,
    favorites,
    votes,
    comments,
  });
}
