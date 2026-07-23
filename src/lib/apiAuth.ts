import { auth } from "@/lib/auth";
import { getBearerToken, verifyMobileToken } from "@/lib/mobileAuth";

export type AuthenticatedMember = {
  id: number;
  email: string;
  name: string | null;
};

/**
 * Resolves the current member from either credential a request might carry:
 * a mobile bearer token, or the web session cookie. This is what lets the
 * same /api/v1 routes serve both the web app and the mobile app — neither
 * caller needs to know which auth mechanism the other one uses.
 */
export async function getAuthenticatedMember(request: Request): Promise<AuthenticatedMember | null> {
  const bearer = getBearerToken(request);

  if (bearer) {
    const member = await verifyMobileToken(bearer);
    return member ? { id: member.id, email: member.email, name: member.name } : null;
  }

  const session = await auth();

  if (session?.user?.id) {
    return {
      id: Number(session.user.id),
      email: session.user.email ?? "",
      name: session.user.name ?? null,
    };
  }

  return null;
}
