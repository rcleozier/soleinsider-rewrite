import { auth } from "@/lib/auth";

export const ADMIN_EMAIL = "rcleozier@gmail.com";

/**
 * Server actions bypass the /admin layout's page-level redirect (they're
 * invoked directly, not via a page render), so every admin mutation must
 * check this itself rather than relying on the layout alone.
 */
export async function requireAdmin() {
  const session = await auth();
  const email = session?.user?.email?.trim().toLowerCase();

  if (email !== ADMIN_EMAIL) {
    throw new Error("Not authorized.");
  }
}
