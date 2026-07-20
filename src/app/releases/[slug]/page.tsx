import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReleaseDetailView } from "@/components/ReleaseDetailView";
import {
  getDbProductComments,
  getDbProductImages,
  getDbRelatedReleases,
  getDbReleaseBySlug,
} from "@/lib/dbReleases";
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

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: ReleasePageProps): Promise<Metadata> {
  const { slug } = await params;
  const release = await getDbReleaseBySlug(slug);

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
  const release = await getDbReleaseBySlug(slug);

  if (!release) {
    notFound();
  }

  const [images, dbComments, dbRelatedProducts] = await Promise.all([
    getDbProductImages(release.product_id, release.image),
    getDbProductComments(release.product_id),
    getDbRelatedReleases(release, 8),
  ]);
  return (
    <ReleaseDetailView
      comments={dbComments}
      images={images}
      release={release}
      relatedProducts={dbRelatedProducts}
    />
  );
}
