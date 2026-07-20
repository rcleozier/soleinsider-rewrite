import Image from "next/image";
import Link from "next/link";
import {
  formatTempDate,
  formatTempPrice,
  getTempReleases,
} from "@/lib/tempReleases";

export const dynamic = "force-dynamic";

export default async function TempReleasesPage() {
  const releases = await getTempReleases();

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="kicker">SoleInsider Admin</p>
          <h1>Pending Release Approvals</h1>
          <p>Review crawler discoveries before they move into the main release archive.</p>
        </div>
        <Link href="/">View Site</Link>
      </header>

      <section className="admin-temp-grid">
        {releases.map((release) => (
          <article className="admin-temp-card" key={release.id}>
            <div className="admin-temp-card__media">
              <Image
                src={release.image || "https://soleinsider.com/public/products/default.png"}
                alt=""
                fill
                sizes="(max-width: 800px) 100vw, 33vw"
              />
              <span className={release.status === "approved" ? "is-approved" : ""}>
                {release.status === "approved" ? "Approved" : "Pending"}
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
              <Link href={`/admin/viewTempReleases/${release.id}`}>View Details</Link>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
