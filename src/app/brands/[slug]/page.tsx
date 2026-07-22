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
  const stats = getBrandStats(releases);

  return (
    <main className="editorial-home brands-page brand-detail">
      <header className="ed-masthead">
        <p className="ed-cat">
          <Link href="/brands">← All brands</Link>
        </p>
        <h1>{brand.label}</h1>
        <p className="ed-deck">
          Every {brand.label} release on file, newest first.
        </p>
      </header>

      {releases.length ? (
        <section className="brand-stats" aria-label="Archive summary">
          <div>
            <strong>
              {releases.length}
              {releases.length === 200 ? "+" : ""}
            </strong>
            <span>{releases.length === 1 ? "Release" : "Releases"}</span>
          </div>
          {stats.latestYear ? (
            <div>
              <strong>{stats.latestYear}</strong>
              <span>Most recent</span>
            </div>
          ) : null}
          {stats.priceRange ? (
            <div>
              <strong>{stats.priceRange}</strong>
              <span>Retail range</span>
            </div>
          ) : null}
          {stats.topType ? (
            <div>
              <strong>{stats.topType}</strong>
              <span>Mostly</span>
            </div>
          ) : null}
        </section>
      ) : null}

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

function getBrandStats(releases: { type: string; price: string; release_date: string }[]) {
  if (!releases.length) {
    return { latestYear: null, priceRange: null, topType: null };
  }

  const years = releases
    .map((release) => release.release_date.match(/\b(20\d{2}|19\d{2})\b/)?.[1])
    .filter((year): year is string => Boolean(year))
    .map(Number);

  const prices = releases
    .map((release) => Number(release.price))
    .filter((price) => Number.isFinite(price) && price > 0);

  const typeCounts = new Map<string, number>();
  for (const release of releases) {
    const type = formatProductType(release.type);
    typeCounts.set(type, (typeCounts.get(type) ?? 0) + 1);
  }
  const topType = Array.from(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const minPrice = prices.length ? Math.min(...prices) : null;
  const maxPrice = prices.length ? Math.max(...prices) : null;

  return {
    latestYear: years.length ? String(Math.max(...years)) : null,
    priceRange:
      minPrice !== null && maxPrice !== null
        ? minPrice === maxPrice
          ? `$${minPrice}`
          : `$${minPrice}–$${maxPrice}`
        : null,
    topType,
  };
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
