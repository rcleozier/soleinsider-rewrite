import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { getBrandDefinition } from "@/lib/brands";
import { getDbReleasesByPatterns } from "@/lib/dbReleases";
import {
  buildMetadata,
  formatReleaseDate,
  getReleaseImage,
  getReleaseUrl,
} from "@/lib/siteData";

type BrandPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: BrandPageProps): Promise<Metadata> {
  const { slug } = await params;
  const brand = getBrandDefinition(slug);

  if (!brand || brand.href) {
    return {};
  }

  return buildMetadata({
    title: `${brand.label} Releases`,
    description: `Every ${brand.label} release in the SoleInsider archive, with retail prices, style codes, and dates.`,
    path: `/brands/${brand.slug}`,
  });
}

export const dynamic = "force-dynamic";

export default async function BrandPage({ params }: BrandPageProps) {
  const { slug } = await params;
  const brand = getBrandDefinition(slug);

  if (!brand) {
    notFound();
  }

  // Brands with an established SEO archive page (e.g. /nike-releases) render
  // there instead of duplicating the listing at a second URL.
  if (brand.href) {
    permanentRedirect(brand.href);
  }

  const releases = await getDbReleasesByPatterns(brand.patterns, 200);

  return (
    <main className="editorial-home brands-page">
      <header className="ed-masthead">
        <p className="ed-cat">
          <Link href="/brands">Brands</Link>
        </p>
        <h1>{brand.label}</h1>
        <p className="ed-deck">
          Every {brand.label} release on file, newest first.
        </p>
      </header>

      <section className="search-panel">
        <p className="search-count">
          {releases.length
            ? `${releases.length}${releases.length === 200 ? "+" : ""} ${
                releases.length === 1 ? "release" : "releases"
              }`
            : "No releases on file yet"}
        </p>
      </section>

      <div className="cal-list">
        {releases.length ? (
          <ol className="cal-rows search-results">
            {releases.map((release) => (
              <li key={`${release.product_id}-${release.id}`}>
                <Link className="cal-row__media" href={getReleaseUrl(release)}>
                  <Image
                    src={getReleaseImage(release)}
                    alt=""
                    width={160}
                    height={160}
                    sizes="120px"
                  />
                </Link>
                <div className="cal-row__body">
                  <p className="ed-cat">{formatProductType(release.type)}</p>
                  <h2>
                    <Link href={getReleaseUrl(release)}>{release.name}</Link>
                  </h2>
                  <p className="cal-row__meta">
                    {formatReleaseDate(release)} · SKU {release.sku || "TBA"}
                  </p>
                </div>
                <span className="cal-row__price">{formatPrice(release.price)}</span>
              </li>
            ))}
          </ol>
        ) : (
          <section className="search-empty">
            <h2>No {brand.label} releases on file yet.</h2>
            <p className="ed-deck">
              Check back soon, or browse the full release calendar.
            </p>
            <Link className="ed-more" href="/calendar">
              Open the calendar
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}

function formatProductType(type: string) {
  const trimmed = type.trim();

  if (!trimmed) {
    return "Release";
  }

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function formatPrice(price: string) {
  const value = price.trim();

  if (!value || value === "0") {
    return "TBA";
  }

  return value.startsWith("$") ? value : `$${value}`;
}
