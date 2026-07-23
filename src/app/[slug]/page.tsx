import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ArchiveReleaseFilter } from "@/lib/dbReleases";
import { getDbArchiveReleaseCount, getDbArchiveReleases } from "@/lib/dbReleases";
import {
  buildMetadata,
  formatReleaseDate,
  getAbsoluteReleaseUrl,
  getBrandReleasePage,
  getReleaseArchivePage,
  getReleaseImage,
  getReleaseUrl,
  siteName,
  siteUrl,
} from "@/lib/siteData";

const PAGE_SIZE = 30;

type ArchivePageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
};

type ArchiveDefinition = {
  title: string;
  description: string;
  path: string;
  filter: ArchiveReleaseFilter;
};

export async function generateMetadata({ params }: ArchivePageProps): Promise<Metadata> {
  const { slug } = await params;
  const definition = getArchiveDefinition(slug);

  if (!definition) {
    return {};
  }

  return buildMetadata({
    title: definition.title,
    description: definition.description,
    path: definition.path,
  });
}

export const dynamic = "force-dynamic";

export default async function ArchivePage({ params, searchParams }: ArchivePageProps) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const definition = getArchiveDefinition(slug);

  if (!definition) {
    notFound();
  }

  const page = Math.max(1, Number(pageParam) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const [releases, totalCount] = await Promise.all([
    getDbArchiveReleases(definition.filter, PAGE_SIZE, offset),
    getDbArchiveReleaseCount(definition.filter),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${definition.title} | ${siteName}`,
    url: `${siteUrl}${definition.path}`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: releases.map((release, index) => ({
        "@type": "ListItem",
        position: offset + index + 1,
        name: release.name,
        url: getAbsoluteReleaseUrl(release),
      })),
    },
  };

  return (
    <main className="editorial-home">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="ed-masthead">
        <p className="ed-cat">Release archive</p>
        <h1>{definition.title}</h1>
        <p className="ed-deck">{definition.description}</p>
      </header>

      <div className="cal-list">
        {releases.length ? (
          <ol className="cal-rows search-results">
            {releases.map((release) => (
              <li key={release.product_id}>
                <Link className="cal-row__media" href={getReleaseUrl(release)}>
                  <Image src={getReleaseImage(release)} alt="" width={160} height={160} sizes="120px" />
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
            <h2>No releases found.</h2>
            <p className="ed-deck">This archive exists locally, but no matching database records were found.</p>
            <Link className="ed-more" href="/calendar">
              Open the calendar
            </Link>
          </section>
        )}

        {totalPages > 1 ? (
          <nav className="ed-pagination" aria-label="Archive pagination">
            {page > 1 ? (
              <Link href={page === 2 ? `/${slug}` : `/${slug}?page=${page - 1}`}>← Newer</Link>
            ) : (
              <span aria-hidden="true">← Newer</span>
            )}
            <span className="ed-pagination__status">
              Page {page} of {totalPages}
            </span>
            {page < totalPages ? (
              <Link href={`/${slug}?page=${page + 1}`}>Older →</Link>
            ) : (
              <span aria-hidden="true">Older →</span>
            )}
          </nav>
        ) : null}
      </div>
    </main>
  );
}

function getArchiveDefinition(slug: string): ArchiveDefinition | null {
  const brandPage = getBrandReleasePage(slug);

  if (brandPage) {
    return {
      title: brandPage.title,
      description: brandPage.description,
      path: `/${brandPage.slug}`,
      filter: { type: "sneakers", namePatterns: brandPage.namePatterns },
    };
  }

  const archivePage = getReleaseArchivePage(slug);

  if (archivePage) {
    return {
      title: archivePage.title,
      description: archivePage.description,
      path: `/${archivePage.slug}`,
      filter: { type: archivePage.type },
    };
  }

  if (/^20\d{2}$/.test(slug)) {
    const year = Number(slug);

    return {
      title: `${slug} Sneaker Release Dates`,
      description: `Browse SoleInsider sneaker releases from ${slug}, including release dates, retail prices, SKUs, and product details.`,
      path: `/${slug}`,
      filter: { type: "sneakers", year },
    };
  }

  return null;
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
