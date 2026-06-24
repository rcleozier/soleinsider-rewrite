import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReleaseCard } from "@/components/ReleaseCard";
import { getAllReleases } from "@/lib/legacyMobileApi";
import {
  buildMetadata,
  getBrandReleasePage,
  getReleaseUrl,
  siteName,
  siteUrl,
} from "@/lib/siteData";

type BrandReleasePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: BrandReleasePageProps): Promise<Metadata> {
  const { slug } = await params;
  const brandPage = getBrandReleasePage(slug);

  if (!brandPage) {
    return {};
  }

  return buildMetadata({
    title: brandPage.title,
    description: brandPage.description,
    path: `/${brandPage.slug}`,
  });
}

export default async function BrandReleasePage({
  params,
}: BrandReleasePageProps) {
  const { slug } = await params;
  const brandPage = getBrandReleasePage(slug);

  if (!brandPage) {
    notFound();
  }

  const releases = getAllReleases().filter(brandPage.matcher);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${brandPage.title} | ${siteName}`,
    url: `${siteUrl}/${brandPage.slug}`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: releases.map((release, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: release.name,
        url: getReleaseUrl(release),
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
        <p className="kicker">Release dates</p>
        <h1>{brandPage.title}</h1>
        <p>{brandPage.description}</p>
      </section>

      <section className="content-band">
        <div className="release-grid">
          {releases.map((release) => (
            <ReleaseCard key={release.id} release={release} />
          ))}
        </div>
      </section>
    </main>
  );
}
