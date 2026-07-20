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
  getAllReleases,
  getComments,
  getReleaseBySlug,
  type LegacyRelease,
} from "@/lib/legacyMobileApi";
import {
  buildMetadata,
  formatReleaseDate,
  getBrandName,
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
  const release = (await getDbReleaseBySlug(slug)) ?? getReleaseBySlug(slug);

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
  const release = (await getDbReleaseBySlug(slug)) ?? getReleaseBySlug(slug);

  if (!release) {
    notFound();
  }

  const [images, dbComments, dbRelatedProducts] = await Promise.all([
    getDbProductImages(release.product_id, release.image),
    getDbProductComments(release.product_id),
    getDbRelatedReleases(release, 8),
  ]);
  const comments = dbComments.length ? dbComments : getComments(release.product_id);
  const relatedProducts = dbRelatedProducts.length
    ? dbRelatedProducts
    : getMockRelatedReleases(release);

  return (
    <ReleaseDetailView
      comments={comments}
      images={images}
      release={release}
      relatedProducts={relatedProducts}
    />
  );
}

function getMockRelatedReleases(release: LegacyRelease) {
  const brandName = getBrandName(release);

  return getAllReleases()
    .filter((item) => item.product_id !== release.product_id)
    .sort((a, b) => {
      const aBrandScore = getBrandName(a) === brandName ? 0 : 1;
      const bBrandScore = getBrandName(b) === brandName ? 0 : 1;

      return aBrandScore - bBrandScore || Number(b.product_id) - Number(a.product_id);
    })
    .slice(0, 8);
}
