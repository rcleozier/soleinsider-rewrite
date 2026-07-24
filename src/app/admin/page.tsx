import Image from "next/image";
import Link from "next/link";
import { getAdminStats, getRecentComments, getRecentFavorites } from "@/lib/adminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [stats, recentFavorites, recentComments] = await Promise.all([
    getAdminStats(),
    getRecentFavorites(8),
    getRecentComments(8),
  ]);

  return (
    <main className="admin-dashboard">
      <header className="admin-header">
        <div>
          <p className="kicker">SoleInsider Admin</p>
          <h1>Dashboard</h1>
          <p>An overview of what&apos;s happening across the site.</p>
        </div>
      </header>

      <section className="admin-stats">
        <StatCard label="Members" value={stats.memberCount} />
        <StatCard label="Releases" value={stats.releaseCount} />
        <StatCard label="Pending approvals" value={stats.pendingCount} href="/admin/tempReleases?status=pending" />
        <StatCard label="Comments" value={stats.commentCount} />
        <StatCard label="Favorites" value={stats.favoriteCount} />
      </section>

      <section className="admin-quick-links">
        <Link className="admin-quick-link" href="/admin/tempReleases">
          <strong>Pending Releases</strong>
          <span>Review crawler discoveries and approve, reject, or delete them.</span>
        </Link>
        <Link className="admin-quick-link" href="/admin/addRelease">
          <strong>Add Release</strong>
          <span>Create a product and release date directly.</span>
        </Link>
      </section>

      <div className="admin-dashboard__columns">
        <section className="admin-panel">
          <h2>Recently saved by members</h2>
          {recentFavorites.length ? (
            <ul className="admin-activity-list">
              {recentFavorites.map((favorite) => (
                <li key={favorite.id}>
                  <span className="admin-activity-list__media">
                    {favorite.productImage ? (
                      <Image src={favorite.productImage} alt="" width={44} height={44} />
                    ) : null}
                  </span>
                  <span className="admin-activity-list__body">
                    <strong>
                      {favorite.productUrl ? (
                        <Link href={favorite.productUrl}>{favorite.productName}</Link>
                      ) : (
                        favorite.productName
                      )}
                    </strong>
                    <span>
                      Saved by {favorite.memberName}
                      {favorite.createdAt ? ` · ${formatDate(favorite.createdAt)}` : ""}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="admin-panel__empty">No favorites saved yet.</p>
          )}
        </section>

        <section className="admin-panel">
          <h2>Recent comments</h2>
          {recentComments.length ? (
            <ul className="admin-comment-list">
              {recentComments.map((comment) => (
                <li key={comment.id}>
                  <p>{comment.comment || "(empty comment)"}</p>
                  <span>
                    {comment.memberName} on{" "}
                    {comment.productUrl ? (
                      <Link href={comment.productUrl}>{comment.productName}</Link>
                    ) : (
                      comment.productName
                    )}
                    {comment.createdAt ? ` · ${formatDate(comment.createdAt)}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="admin-panel__empty">No comments yet.</p>
          )}
        </section>
      </div>
    </main>
  );
}

function StatCard({ label, value, href }: { label: string; value: number; href?: string }) {
  const content = (
    <>
      <span className="admin-stat-card__value">{value.toLocaleString()}</span>
      <span className="admin-stat-card__label">{label}</span>
    </>
  );

  if (href) {
    return (
      <Link className="admin-stat-card" href={href}>
        {content}
      </Link>
    );
  }

  return <div className="admin-stat-card">{content}</div>;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date);
}
