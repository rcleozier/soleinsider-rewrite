import Image from "next/image";
import Link from "next/link";
import { getProductImageUrl } from "@/lib/productImages";
import {
  formatTempDate,
  formatTempPrice,
  getTempReleaseCounts,
  getTempReleases,
  type TempReleaseStatusFilter,
} from "@/lib/tempReleases";

export const dynamic = "force-dynamic";

type TempReleasesPageProps = {
  searchParams: Promise<{ status?: string }>;
};

const statusTabs: { value: TempReleaseStatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
];

export default async function TempReleasesPage({ searchParams }: TempReleasesPageProps) {
  const { status: statusParam } = await searchParams;
  const status: TempReleaseStatusFilter =
    statusParam === "pending" || statusParam === "approved" ? statusParam : "all";

  const [releases, counts] = await Promise.all([
    getTempReleases({ status }),
    getTempReleaseCounts(),
  ]);

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="kicker">SoleInsider Admin</p>
          <h1>Pending Release Approvals</h1>
          <p>Review crawler discoveries before they move into the main release archive.</p>
        </div>
        <div className="admin-header__meta">
          <Link className="admin-header__button" href="/admin/addRelease">
            + Add Release
          </Link>
          <Link className="admin-header__link" href="/">
            View Site
          </Link>
          <p className="admin-header__count">
            Total: <strong>{counts.total.toLocaleString()}</strong> releases ·{" "}
            <strong>{counts.pending.toLocaleString()}</strong> pending
          </p>
          <nav className="admin-status-tabs" aria-label="Filter by status">
            {statusTabs.map((tab) => (
              <Link
                aria-current={tab.value === status ? "page" : undefined}
                href={tab.value === "all" ? "/admin/tempReleases" : `/admin/tempReleases?status=${tab.value}`}
                key={tab.value}
              >
                {tab.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {releases.length ? (
        <section className="admin-temp-grid">
          {releases.map((release) => (
            <article className="admin-temp-card" key={release.id}>
              <div className="admin-temp-card__media">
                <Image
                  src={getProductImageUrl(release.image)}
                  alt=""
                  fill
                  sizes="(max-width: 800px) 100vw, 33vw"
                />
                <span className={release.status === "approved" ? "is-approved" : ""}>
                  {release.status === "approved" ? "✓ Approved" : "Pending"}
                </span>
              </div>
              <div className="admin-temp-card__body">
                <h2>{release.name}</h2>
                <dl>
                  <div>
                    <dt>Price</dt>
                    <dd>{formatTempPrice(release.price)}</dd>
                  </div>
                  <div>
                    <dt>SKU</dt>
                    <dd>{release.sku || "TBA"}</dd>
                  </div>
                  <div>
                    <dt>Type</dt>
                    <dd>{release.type}</dd>
                  </div>
                  <div>
                    <dt>Date</dt>
                    <dd>{formatTempDate(release.releaseDate)}</dd>
                  </div>
                </dl>
                <Link href={`/admin/viewTempReleases/${release.id}`}>👁 View Details</Link>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <p className="admin-temp-empty">
          {status === "all"
            ? "No crawler discoveries on file yet. Run a crawler to populate this queue."
            : `No ${status} releases right now.`}
        </p>
      )}
    </main>
  );
}
