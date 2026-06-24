import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReleaseDetailView } from "@/components/ReleaseDetailView";
import {
  getAllReleases,
  getComments,
  getReleaseBySlug,
} from "@/lib/legacyMobileApi";
import {
  buildMetadata,
  formatReleaseDate,
  getReleaseImage,
} from "@/lib/siteData";

type ReleasePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return getAllReleases().map((release) => ({
    slug: release.slug,
  }));
}

export async function generateMetadata({
  params,
}: ReleasePageProps): Promise<Metadata> {
  const { slug } = await params;
  const release = getReleaseBySlug(slug);

  if (!release) {
    return {};
  }

  return buildMetadata({
    title: `${release.name} Release Date`,
    description: `${release.name} releases ${formatReleaseDate(
      release,
    )} for $${release.price}. See SKU, retail price, COP/DROP votes, and launch details.`,
    path: `/releases/${release.slug}`,
    image: getReleaseImage(release),
  });
}

export default async function ReleaseDetailPage({ params }: ReleasePageProps) {
  const { slug } = await params;
  const release = getReleaseBySlug(slug);

  if (!release) {
    notFound();
  }

  const comments = getComments(release.product_id);

  return <ReleaseDetailView comments={comments} release={release} />;
}
