import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/siteData";

export const metadata: Metadata = buildMetadata({
  title: "Log in",
  description:
    "Sign in to SoleInsider to favorite releases, track drops, and join the conversation on product pages.",
  path: "/login",
});

export default function LoginPage() {
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
          <strong>Accounts are not live yet.</strong>
          <p>
            Sign-in is still being wired up, so this form is disabled — no
            credentials are collected or stored. In the meantime, the mobile app
            handles favorites, reminders, and comments.
          </p>
          <Link className="ed-more" href="/app">
            Get the app
          </Link>
        </div>

        <form className="login-form" aria-describedby="login-disabled-note">
          <fieldset disabled>
            <legend className="ed-sr-only">Sign in</legend>

            <button className="login-google" type="button">
              <GoogleMark />
              Continue with Google
            </button>

            <div className="login-divider">
              <span>or</span>
            </div>

            <label htmlFor="login-email">Email</label>
            <input
              autoComplete="email"
              id="login-email"
              name="email"
              placeholder="you@example.com"
              type="email"
            />

            <label htmlFor="login-password">Password</label>
            <input
              autoComplete="current-password"
              id="login-password"
              name="password"
              placeholder="••••••••"
              type="password"
            />

            <button className="login-submit" type="submit">
              Log in
            </button>
          </fieldset>

          <p className="login-foot" id="login-disabled-note">
            New here? Account creation opens with sign-in. By using SoleInsider
            you agree to our <Link href="/terms">Terms</Link> and{" "}
            <Link href="/privacy">Privacy Policy</Link>.
          </p>
        </form>
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
