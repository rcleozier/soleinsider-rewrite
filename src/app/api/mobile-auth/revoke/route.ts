import { apiError, apiSuccess } from "@/lib/api/response";
import { getBearerToken, revokeMobileToken } from "@/lib/mobileAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/mobile-auth/revoke
 * Requires `Authorization: Bearer <token>`. Revokes that token — the app's
 * "log out" call. Idempotent: revoking twice is not an error.
 */
export async function POST(request: Request) {
  const token = getBearerToken(request);

  if (!token) {
    return apiError("Missing bearer token.", 401);
  }

  await revokeMobileToken(token);

  return apiSuccess({ revoked: true });
}
