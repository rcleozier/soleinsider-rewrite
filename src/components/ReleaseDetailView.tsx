import Link from "next/link";
import { CopDropButtons } from "@/components/CopDropButtons";
import { LiveCountdown } from "@/components/LiveCountdown";
import { ProductImageCarousel } from "@/components/ProductImageCarousel";
import { RelatedProductsCarousel } from "@/components/RelatedProductsCarousel";
import type { ProductDetailComment } from "@/lib/dbReleases";
import type { LegacyRelease } from "@/lib/legacyMobileApi";
import {
  cleanHtmlContent,
  formatReleaseDate,
  getAbsoluteReleaseUrl,
  getBrandName,
  getReleaseImage,
} from "@/lib/siteData";

export function ReleaseDetailView({
  release,
  images = [getReleaseImage(release)],
  comments,
  relatedProducts = [],
}: {
  release: LegacyRelease;
  images?: string[];
  comments: ProductDetailComment[];
  relatedProducts?: LegacyRelease[];
}) {
  const cleanedDescription = cleanHtmlContent(release.content);
  const fallbackDescription = `${release.name} is listed on the SoleInsider release calendar with retail pricing, SKU details, and mobile app voting data.`;
  const description = cleanedDescription || fallbackDescription;
  const galleryImages = images.length ? images : [getReleaseImage(release)];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: release.name,
    sku: release.sku,
    image: galleryImages,
    description,
    brand: {
      "@type": "Brand",
      name: getBrandName(release),
    },
    offers: {
      "@type": "Offer",
      price: release.price,
      priceCurrency: "USD",
      availability: "https://schema.org/PreOrder",
      url: getAbsoluteReleaseUrl(release),
    },
    aggregateRating:
      Number(release.total_votes) > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: Math.max(1, Number(release.yes_percentage) / 20),
            reviewCount: release.total_votes,
          }
        : undefined,
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="release-detail">
        <div className="release-detail__media">
          <ProductImageCarousel images={galleryImages} name={release.name} />
        </div>
        <div className="release-detail__content">
          <Link href="/" className="text-link">
            Release calendar
          </Link>
          <a
            className="text-link text-link--external"
            href={getAbsoluteReleaseUrl(release)}
          >
            View live SoleInsider product
          </a>
          <p className="kicker">{getBrandName(release)} release date</p>
          <h1>{release.name}</h1>
          {cleanedDescription ? (
            <p>{cleanedDescription}</p>
          ) : (
            <p>{fallbackDescription}</p>
          )}
          <LiveCountdown releaseDateCalendar={release.release_date_calendar} />
          <dl className="release-facts">
            <div>
              <dt>Release date</dt>
              <dd>{formatReleaseDate(release)}</dd>
            </div>
            <div>
              <dt>Retail price</dt>
              <dd>${release.price}</dd>
            </div>
            <div>
              <dt>Style code</dt>
              <dd>{release.sku || "TBA"}</dd>
            </div>
            <div>
              <dt>COP / DROP</dt>
              <dd>
                {release.yes_percentage}% / {release.no_percentage}%
              </dd>
            </div>
          </dl>
          <CopDropButtons release={release} />
        </div>
      </article>

      <RelatedProductsCarousel products={relatedProducts} />

      <section className="content-band content-band--light">
        <div className="section-heading">
          <p className="kicker">Mobile app conversation</p>
          <h2>Latest comments</h2>
          <p>
            Existing release discussion from SoleInsider visitors stays with
            the product detail page.
          </p>
        </div>
        <div className="comment-list">
          {comments.length ? (
            comments.map((comment) => (
              <article key={comment.id}>
                <p>{comment.comment}</p>
                <footer>
                  <span>{comment.comment_date}</span>
                  <span>{comment.votes_up} upvotes</span>
                </footer>
              </article>
            ))
          ) : (
            <p>No comments yet for this release.</p>
          )}
        </div>
      </section>
    </main>
  );
}
