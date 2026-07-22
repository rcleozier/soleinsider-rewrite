import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/siteData";
import { loginWithCredentials, signInWithGoogle } from "@/lib/authActions";

export const metadata: Metadata = buildMetadata({
  title: "Log in",
  description:
    "Sign in to SoleInsider to favorite releases, track drops, and join the conversation on product pages.",
  path: "/login",
});

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;

  return (
    <main className="editorial-home login-page">
      <header className="ed-masthead">
        <p className="ed-cat">Account</p>
        <h1>Log in to SoleInsider.</h1>
        <p className="ed-deck">
          Favorite releases, keep your drop list in sync with the app, and
          comment on product pages.
        </p>
      </header>

      <section className="login-panel">
        <div className="login-notice" role="status">
          <strong>New to SoleInsider?</strong>
          <p>
            Create an account to favorite releases, track drops, and join the
            conversation on product pages. You can also get the mobile app for
            push reminders on release day.
          </p>
          <Link className="ed-more" href="/app">
            Get the app
          </Link>
        </div>

        <div className="login-form">
          {error ? (
            <p className="login-error" role="alert">
              {error}
            </p>
          ) : null}

          <form action={signInWithGoogle}>
            <button className="login-google" type="submit">
              <GoogleMark />
              Continue with Google
            </button>
          </form>

          <div className="login-divider">
            <span>or</span>
          </div>

          <form action={loginWithCredentials}>
            <fieldset>
              <legend className="ed-sr-only">Sign in</legend>

              <label htmlFor="login-email">Email</label>
              <input
                autoComplete="email"
                id="login-email"
                name="email"
                placeholder="you@example.com"
                required
                type="email"
              />

              <label htmlFor="login-password">Password</label>
              <input
                autoComplete="current-password"
                id="login-password"
                name="password"
                placeholder="••••••••"
                required
                type="password"
              />

              <button className="login-submit" type="submit">
                Log in
              </button>
            </fieldset>
          </form>

          <p className="login-foot">
            New here? <Link href="/signup">Create an account</Link>. By using
            SoleInsider you agree to our <Link href="/terms">Terms</Link> and{" "}
            <Link href="/privacy">Privacy Policy</Link>.
          </p>
        </div>
      </section>
    </main>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 18 18" width="18" height="18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}
