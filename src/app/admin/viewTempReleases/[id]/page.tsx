import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductImageUrl } from "@/lib/productImages";
import { cleanHtmlContent } from "@/lib/siteData";
import {
  approveTempRelease,
  formatTempDate,
  formatTempPrice,
  getTempRelease,
  getTempReleaseImages,
} from "@/lib/tempReleases";

export const dynamic = "force-dynamic";

type TempReleasePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function TempReleaseDetailPage({ params }: TempReleasePageProps) {
  const id = Number((await params).id);

  if (!Number.isFinite(id)) {
    notFound();
  }

  const [release, images] = await Promise.all([getTempRelease(id), getTempReleaseImages(id)]);

  if (!release) {
    notFound();
  }

  const isApproved = release.status === "approved";
  const primaryImage =
    getProductImageUrl(release.image || images[0]?.image);

  return (
    <main className="admin-shell">
      <Link className="admin-back-link" href="/admin/tempReleases">
        Back to Pending Releases
      </Link>

      <section className="admin-temp-detail">
        <div className="admin-temp-detail__media">
          <Image src={primaryImage} alt="" fill sizes="(max-width: 900px) 100vw, 42vw" />
          <span className={isApproved ? "is-approved" : ""}>
            {isApproved ? "Approved" : "Pending"}
          </span>
        </div>
        <div className="admin-temp-detail__content">
          <h1>{release.name}</h1>
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
              <dt>Release Date</dt>
              <dd>{formatTempDate(release.releaseDate)}</dd>
            </div>
          </dl>
          {isApproved ? (
            <p className="admin-approved-note">This release has already been approved.</p>
          ) : (
            <form action={approveTempRelease}>
              <input type="hidden" name="id" value={release.id} />
              <button type="submit">Approve Release</button>
            </form>
          )}
          <a href={release.link}>Source URL</a>
        </div>
      </section>

      <section className="admin-temp-description">
        <h2>Description</h2>
        <p>{cleanHtmlContent(release.content || release.description) || "No description provided."}</p>
      </section>

      {images.length ? (
        <section className="admin-temp-images">
          <h2>Images</h2>
          <div>
            {images.map((image) => (
              <Image
                key={image.id}
                src={getProductImageUrl(image.image)}
                alt=""
                width={220}
                height={180}
              />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
