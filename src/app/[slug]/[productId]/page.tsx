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
  getAllReleases,
  getComments,
  getReleaseBySlugAndId,
  type LegacyRelease,
} from "@/lib/legacyMobileApi";
import {
  buildMetadata,
  formatReleaseDate,
  getBrandName,
  getReleaseImage,
} from "@/lib/siteData";

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
  const release =
    (await getDbReleaseBySlugAndId(slug, productId)) ??
    getReleaseBySlugAndId(slug, productId);

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
  const release =
    (await getDbReleaseBySlugAndId(slug, productId)) ??
    getReleaseBySlugAndId(slug, productId);

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
