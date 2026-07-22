import { prisma } from "@/lib/prisma";
import { getProductImageUrl } from "@/lib/productImages";

export type MemberFavorite = {
  id: number;
  productId: number;
  name: string;
  slug: string;
  image: string;
  url: string;
  favoritedAt: Date | null;
};

export type MemberComment = {
  id: number;
  productId: number | null;
  comment: string;
  createdAt: Date | null;
  product: { name: string; url: string } | null;
};

/** Releases a member marked "cop" (status 1) in release_interest — the closest thing to a favorites list. */
export async function getMemberFavorites(memberId: number): Promise<MemberFavorite[]> {
  const interests = await prisma.releaseInterest.findMany({
    where: { memberId, status: 1 },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const productIds = interests.map((interest) => interest.productId).filter((id): id is number => id !== null);

  if (!productIds.length) {
    return [];
  }

  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  const productsById = new Map(products.map((product) => [product.id, product]));

  return interests
    .map((interest) => {
      const product = interest.productId ? productsById.get(interest.productId) : null;

      if (!product) {
        return null;
      }

      return {
        id: interest.id,
        productId: product.id,
        name: product.name,
        slug: product.slug,
        image: getProductImageUrl(product.image),
        url: `/${product.slug}/${product.id}`,
        favoritedAt: interest.createdAt,
      };
    })
    .filter((favorite): favorite is MemberFavorite => favorite !== null);
}

export async function getMemberComments(memberId: number): Promise<MemberComment[]> {
  const comments = await prisma.comment.findMany({
    where: { memberId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const productIds = comments.map((comment) => comment.productId).filter((id): id is number => id !== null);
  const products = productIds.length
    ? await prisma.product.findMany({ where: { id: { in: productIds } } })
    : [];
  const productsById = new Map(products.map((product) => [product.id, product]));

  return comments.map((comment) => {
    const product = comment.productId ? productsById.get(comment.productId) : null;

    return {
      id: comment.id,
      productId: comment.productId,
      comment: comment.comment ?? "",
      createdAt: comment.createdAt,
      product: product ? { name: product.name, url: `/${product.slug}/${product.id}` } : null,
    };
  });
}
