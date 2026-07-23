import { apiError, apiSuccess } from "@/lib/api/response";
import { exchangeMobileAuthCode } from "@/lib/mobileAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ERROR_MESSAGES: Record<string, string> = {
  invalid_code: "This code is invalid.",
  expired_code: "This code has expired. Sign in again from the app.",
  code_already_used: "This code has already been used.",
};

/**
 * POST /api/mobile-auth/exchange
 * Body: { "code": "..." } — the one-time code minted by /mobile-auth/complete.
 * Returns { token } on success. The token is shown to the app exactly once.
 */
export async function POST(request: Request) {
  let code: unknown;

  try {
    const body = await request.json();
    code = body?.code;
  } catch {
    return apiError("Expected a JSON body with a `code` field.", 400);
  }

  if (typeof code !== "string" || !code) {
    return apiError("`code` is required.", 400);
  }

  const result = await exchangeMobileAuthCode(code);

  if (!result.success) {
    return apiError(ERROR_MESSAGES[result.error] ?? "Unable to exchange code.", 400);
  }

  return apiSuccess({ token: result.token });
}
