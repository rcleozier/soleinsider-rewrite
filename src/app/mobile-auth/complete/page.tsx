import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { createMobileAuthCode, sanitizeMobileRedirectUri } from "@/lib/mobileAuth";

export const dynamic = "force-dynamic";

type MobileAuthCompletePageProps = {
  searchParams: Promise<{ mobileRedirectUri?: string }>;
};

/**
 * Browser bridge between the web session and the mobile app: confirms the
 * user is logged in (bouncing to /login and back if not), mints a one-time
 * code, and hands off to the app via its deep link.
 */
export default async function MobileAuthCompletePage({ searchParams }: MobileAuthCompletePageProps) {
  const { mobileRedirectUri } = await searchParams;
  const redirectUri = sanitizeMobileRedirectUri(mobileRedirectUri);

  if (!redirectUri) {
    return (
      <main className="editorial-home login-page">
        <header className="ed-masthead">
          <p className="ed-cat">Account</p>
          <h1>Unable to sign in to the app.</h1>
          <p className="ed-deck">
            This link is missing or has an invalid app redirect. Open this page from the SoleInsider app rather
            than directly.
          </p>
        </header>
      </main>
    );
  }

  const session = await auth();

  if (!session?.user?.id) {
    const callbackUrl = `/mobile-auth/complete?mobileRedirectUri=${encodeURIComponent(redirectUri)}`;
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  const code = await createMobileAuthCode(Number(session.user.id));

  redirect(`${redirectUri}?code=${encodeURIComponent(code)}`);
}
