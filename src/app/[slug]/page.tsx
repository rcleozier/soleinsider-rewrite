import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReleaseCard } from "@/components/ReleaseCard";
import { getDbReleaseDatesUnformatted } from "@/lib/dbMobileApi";
import type { LegacyRelease } from "@/lib/legacyMobileApi";
import {
  buildMetadata,
  getAbsoluteReleaseUrl,
  getBrandReleasePage,
  getReleaseArchivePage,
  siteName,
  siteUrl,
} from "@/lib/siteData";

type ArchivePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type ArchiveDefinition = {
  title: string;
  description: string;
  path: string;
  type: string;
  matcher?: (release: LegacyRelease) => boolean;
};

export async function generateMetadata({
  params,
}: ArchivePageProps): Promise<Metadata> {
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

export default async function ArchivePage({ params }: ArchivePageProps) {
  const { slug } = await params;
  const definition = getArchiveDefinition(slug);

  if (!definition) {
    notFound();
  }

  const allReleases = await getDbReleaseDatesUnformatted(definition.type, 240);
  const releases = definition.matcher ? allReleases.filter(definition.matcher) : allReleases;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${definition.title} | ${siteName}`,
    url: `${siteUrl}${definition.path}`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: releases.slice(0, 60).map((release, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: release.name,
        url: getAbsoluteReleaseUrl(release),
      })),
    },
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="subpage-hero">
        <p className="kicker">Release archive</p>
        <h1>{definition.title}</h1>
        <p>{definition.description}</p>
      </section>

      <section className="content-band">
        {releases.length ? (
          <div className="release-grid">
            {releases.map((release) => (
              <ReleaseCard key={release.id} release={release} />
            ))}
          </div>
        ) : (
          <div className="homepage-empty">
            <p className="kicker">Archive</p>
            <h2>No releases found.</h2>
            <p>This archive exists locally, but no matching database records were found.</p>
          </div>
        )}
      </section>
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
      type: "sneakers",
      matcher: brandPage.matcher,
    };
  }

  const archivePage = getReleaseArchivePage(slug);

  if (archivePage) {
    return {
      title: archivePage.title,
      description: archivePage.description,
      path: `/${archivePage.slug}`,
      type: archivePage.type,
    };
  }

  if (/^20\d{2}$/.test(slug)) {
    return {
      title: `${slug} Sneaker Release Dates`,
      description: `Browse SoleInsider sneaker releases from ${slug}, including release dates, retail prices, SKUs, and product details.`,
      path: `/${slug}`,
      type: "sneakers",
      matcher: (release) => release.release_date_calendar.startsWith(`${slug},`),
    };
  }

  return null;
}
