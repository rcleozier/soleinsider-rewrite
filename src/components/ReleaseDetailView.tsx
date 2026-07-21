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
  siteUrl,
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
  const brandName = getBrandName(release);
  const brandUrl = getBrandArchiveUrl(brandName);
  const descriptionParagraphs = getDescriptionParagraphs(release.content);
  const description = descriptionParagraphs.join(" ");
  const galleryImages = images.length ? images : [getReleaseImage(release)];
  const productUrl = getAbsoluteReleaseUrl(release);
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: release.name,
      sku: release.sku || undefined,
      image: galleryImages,
      description: description || undefined,
      brand: {
        "@type": "Brand",
        name: brandName,
      },
      releaseDate: getIsoReleaseDate(release.release_date_calendar),
      offers: {
        "@type": "Offer",
        price: getNumericPrice(release.price),
        priceCurrency: "USD",
        availability: "https://schema.org/PreOrder",
        url: productUrl,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Release Calendar",
          item: `${siteUrl}/calendar`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: brandName,
          item: `${siteUrl}${brandUrl}`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: release.name,
        },
      ],
    },
  ];

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
          <nav className="release-breadcrumb" aria-label="Breadcrumb">
            <Link href="/calendar">Release Calendar</Link>
            <span aria-hidden="true">/</span>
            <Link href={brandUrl}>{brandName}</Link>
            <span aria-hidden="true">/</span>
            <span>{release.name}</span>
          </nav>
          <p className="kicker">{brandName} release date</p>
          <h1>{release.name}</h1>
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
          </dl>
          <CopDropButtons release={release} variant="secondary" />
          <section className="release-details-section">
            <h2>Release details</h2>
            {descriptionParagraphs.length ? (
              <div className="release-description">
                {descriptionParagraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            ) : null}
            <dl className="release-specs">
              <div>
                <dt>Model</dt>
                <dd>{getModelName(release.name, brandName)}</dd>
              </div>
              <div>
                <dt>Colorway</dt>
                <dd>{getColorway(release.name)}</dd>
              </div>
              <div>
                <dt>Style Code</dt>
                <dd className="release-specs__style-code">{release.sku || "TBA"}</dd>
              </div>
            </dl>
          </section>
        </div>
      </article>

      <RelatedProductsCarousel products={relatedProducts} />

      <section className="content-band content-band--light">
        <div className="section-heading section-heading--compact comments-heading">
          <h2>Latest comments</h2>
        </div>
        <div className="comment-list">
          {comments.length ? (
            comments.map((comment) => (
              <article key={comment.id}>
                <span className="comment-avatar" aria-hidden="true">
                  SI
                </span>
                <div>
                  <header>
                    <strong>SoleInsider visitor</strong>
                    <time>{comment.comment_date || "Recent"}</time>
                  </header>
                  <p>{comment.comment}</p>
                </div>
                <footer>
                  <span>{comment.votes_up} upvotes</span>
                </footer>
              </article>
            ))
          ) : (
            <article className="comment-empty">
              <h3>No comments yet — the conversation starts in the app</h3>
              <Link href="/download">Download the app</Link>
            </article>
          )}
        </div>
      </section>
    </main>
  );
}

function getDescriptionParagraphs(content: string) {
  const cleaned = cleanHtmlContent(content);

  if (!cleaned) {
    return [];
  }

  const sentences = cleaned.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((sentence) => sentence.trim()) ?? [];

  if (sentences.length <= 2) {
    return [cleaned];
  }

  return [
    sentences.slice(0, Math.ceil(sentences.length / 2)).join(" "),
    sentences.slice(Math.ceil(sentences.length / 2)).join(" "),
  ]
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .slice(0, 3);
}

function getBrandArchiveUrl(brandName: string) {
  const routes: Record<string, string> = {
    Jordan: "/air-jordan-releases",
    Nike: "/nike-releases",
    adidas: "/adidas-releases",
    Yeezy: "/yeezy-releases",
    "New Balance": "/new-balance-releases",
    Puma: "/puma-releases",
    ASICS: "/asics-releases",
    "Off-White": "/off-white-releases",
  };

  return routes[brandName] || "/releases-dates";
}

function getModelName(name: string, brandName: string) {
  const withoutQuotedColor = name.replace(/\s+["“][^"”]+["”].*$/, "").trim();

  if (withoutQuotedColor) {
    return withoutQuotedColor;
  }

  return brandName === "Sneakers" ? name : brandName;
}

function getColorway(name: string) {
  const quoted = name.match(/["“]([^"”]+)["”]/);

  if (quoted?.[1]) {
    return quoted[1];
  }

  const dashParts = name.split(/\s+-\s+/);

  if (dashParts.length > 1) {
    return dashParts.at(-1) || "TBA";
  }

  return "TBA";
}

function getNumericPrice(price: string) {
  const numeric = Number(price);
  return Number.isFinite(numeric) ? numeric.toFixed(2) : undefined;
}

function getIsoReleaseDate(releaseDateCalendar: string) {
  const match = releaseDateCalendar.match(/^(\d{4}),(\d{1,2}),(\d{1,2})/);

  if (!match) {
    return undefined;
  }

  const [, year, month, day] = match.map(Number);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
