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
  cleanHtmlContent,
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

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: LegacyReleasePageProps): Promise<Metadata> {
  const { slug, productId } = await params;
  const release = await getDbReleaseBySlugAndId(slug, productId);

  if (!release) {
    return {};
  }

  const description = getMetaDescription(release);

  return buildMetadata({
    title: `${release.name} Release Date, Price & Style Code — SoleInsider`,
    description,
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

function getMetaDescription(release: Awaited<ReturnType<typeof getDbReleaseBySlugAndId>> & {}) {
  if (!release) {
    return "";
  }

  const cleaned = cleanHtmlContent(release.content);

  if (cleaned) {
    return cleaned.slice(0, 155);
  }

  return `${release.name} releases ${formatReleaseDate(release)} for $${release.price}${
    release.sku ? ` with style code ${release.sku}` : ""
  }.`;
}
