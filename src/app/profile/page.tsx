import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { signOutAction } from "@/lib/authActions";
import { getMemberComments, getMemberFavorites } from "@/lib/memberProfile";
import { buildMetadata } from "@/lib/siteData";

export const metadata: Metadata = buildMetadata({
  title: "Your profile",
  description: "Your favorited releases and comments on SoleInsider.",
  path: "/profile",
});

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const memberId = Number(session.user.id);
  const [favorites, comments] = await Promise.all([
    getMemberFavorites(memberId),
    getMemberComments(memberId),
  ]);

  return (
    <main className="editorial-home profile-page">
      <header className="ed-masthead">
        <p className="ed-cat">Account</p>
        <h1>{session.user.name || session.user.email}</h1>
        <p className="ed-deck">{session.user.email}</p>
        <form action={signOutAction}>
          <button className="ed-more profile-signout" type="submit">
            Sign out
          </button>
        </form>
      </header>

      <section className="profile-section">
        <h2>Favorited releases</h2>

        {favorites.length ? (
          <div className="cal-list">
            <ol className="cal-rows">
              {favorites.map((favorite) => (
                <li key={favorite.id}>
                  <Link className="cal-row__media" href={favorite.url}>
                    <Image src={favorite.image} alt="" width={160} height={160} sizes="120px" />
                  </Link>
                  <div className="cal-row__body">
                    <h3>
                      <Link href={favorite.url}>{favorite.name}</Link>
                    </h3>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        ) : (
          <p className="profile-empty">
            No favorited releases yet. Cop a release from the app to see it here.
          </p>
        )}
      </section>

      <section className="profile-section">
        <h2>Your comments</h2>

        {comments.length ? (
          <ul className="profile-comments">
            {comments.map((comment) => (
              <li key={comment.id}>
                <p>{comment.comment}</p>
                <p className="profile-comments__meta">
                  {comment.product ? (
                    <Link href={comment.product.url}>{comment.product.name}</Link>
                  ) : (
                    "Deleted release"
                  )}
                  {comment.createdAt ? ` · ${formatDate(comment.createdAt)}` : null}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="profile-empty">No comments yet.</p>
        )}
      </section>
    </main>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date);
}
