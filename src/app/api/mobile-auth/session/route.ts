import { apiError, apiSuccess } from "@/lib/api/response";
import { getBearerToken, verifyMobileToken } from "@/lib/mobileAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/mobile-auth/session
 * Requires `Authorization: Bearer <token>`. Returns the current member, or
 * 401 if the token is missing, unknown, revoked, or expired.
 */
export async function GET(request: Request) {
  const token = getBearerToken(request);

  if (!token) {
    return apiError("Missing bearer token.", 401);
  }

  const member = await verifyMobileToken(token);

  if (!member) {
    return apiError("Invalid, expired, or revoked token.", 401);
  }

  return apiSuccess({ user: member });
}
