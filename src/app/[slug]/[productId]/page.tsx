import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReleaseDetailView } from "@/components/ReleaseDetailView";
import {
  getDbProductComments,
  getDbProductImages,
  getDbRelatedReleases,
  getDbReleaseBySlugAndId,
} from "@/lib/dbReleases";
import {
  buildMetadata,
  formatReleaseDate,
  getReleaseImage,
} from "@/lib/siteData";

type LegacyReleasePageProps = {
  params: Promise<{
    slug: string;
    productId: string;
  }>;
};

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: LegacyReleasePageProps): Promise<Metadata> {
  const { slug, productId } = await params;
  const release = await getDbReleaseBySlugAndId(slug, productId);

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
  const release = await getDbReleaseBySlugAndId(slug, productId);

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
