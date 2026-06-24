import Image from "next/image";
import Link from "next/link";
import { CountdownModule } from "@/components/CountdownModule";
import { CopDropButtons } from "@/components/CopDropButtons";
import type { LegacyRelease } from "@/lib/legacyMobileApi";
import {
  cleanHtmlContent,
  formatReleaseDate,
  getAbsoluteReleaseUrl,
  getBrandName,
  getReleaseImage,
} from "@/lib/siteData";

type Comment = {
  id: string;
  comment: string | null;
  comment_date: string | null;
  votes_up: string;
};

export function ReleaseDetailView({
  release,
  comments,
}: {
  release: LegacyRelease;
  comments: Comment[];
}) {
  const description =
    cleanHtmlContent(release.content) ||
    `${release.name} is listed on the SoleInsider release calendar with retail pricing, SKU details, and mobile app voting data.`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: release.name,
    sku: release.sku,
    image: getReleaseImage(release),
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
          <Image
            src={getReleaseImage(release)}
            alt={`${release.name} sneaker`}
            width={760}
            height={760}
            priority
            loading="eager"
          />
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
          <p>{description}</p>
          <CountdownModule releaseDateCalendar={release.release_date_calendar} />
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

      <section className="content-band content-band--light">
        <div className="section-heading">
          <p className="kicker">Mobile app conversation</p>
          <h2>Latest comments</h2>
          <p>
            This section reads from the same mock data backing the legacy
            mobile comments endpoint.
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
            <p>No mock comments yet for this release.</p>
          )}
        </div>
      </section>
    </main>
  );
}
