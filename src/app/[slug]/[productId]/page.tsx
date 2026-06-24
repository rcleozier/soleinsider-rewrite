import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReleaseDetailView } from "@/components/ReleaseDetailView";
import {
  getAllReleases,
  getComments,
  getReleaseBySlugAndId,
} from "@/lib/legacyMobileApi";
import { buildMetadata, formatReleaseDate, getReleaseImage } from "@/lib/siteData";

type LegacyReleasePageProps = {
  params: Promise<{
    slug: string;
    productId: string;
  }>;
};

export function generateStaticParams() {
  return getAllReleases().map((release) => ({
    slug: release.slug,
    productId: release.product_id,
  }));
}

export async function generateMetadata({
  params,
}: LegacyReleasePageProps): Promise<Metadata> {
  const { slug, productId } = await params;
  const release = getReleaseBySlugAndId(slug, productId);

  if (!release) {
    return {};
  }

  return buildMetadata({
    title: `${release.name} Release Date`,
    description: `${release.name} releases ${formatReleaseDate(
      release,
    )} for $${release.price}. See SKU, retail price, COP/DROP votes, and launch details.`,
    path: `/${release.slug}/${release.product_id}`,
    image: getReleaseImage(release),
  });
}

export default async function LegacyReleaseDetailPage({
  params,
}: LegacyReleasePageProps) {
  const { slug, productId } = await params;
  const release = getReleaseBySlugAndId(slug, productId);

  if (!release) {
    notFound();
  }

  return (
    <ReleaseDetailView
      comments={getComments(release.product_id)}
      release={release}
    />
  );
}
