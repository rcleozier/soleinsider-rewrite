import { prisma } from "@/lib/prisma";
import { getProductImageUrl } from "@/lib/productImages";

export type MemberFavorite = {
  id: number;
  productId: number;
  name: string;
  slug: string;
  image: string;
  url: string;
  favoritedAt: Date;
};

export type MemberVote = {
  id: number;
  productId: number;
  status: "cop" | "drop";
  name: string;
  slug: string;
  image: string;
  url: string;
  votedAt: Date | null;
};

export type MemberComment = {
  id: number;
  productId: number | null;
  comment: string;
  createdAt: Date | null;
  product: { name: string; url: string } | null;
};

type ProductSummary = { id: number; name: string; slug: string; image: string };

async function productsById(productIds: number[]): Promise<Map<number, ProductSummary>> {
  if (!productIds.length) {
    return new Map();
  }

  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, slug: true, image: true },
  });

  return new Map(products.map((product) => [product.id, product]));
}

/** Releases the member explicitly bookmarked — distinct from a cop/drop vote. */
export async function getMemberFavorites(memberId: number): Promise<MemberFavorite[]> {
  const favorites = await prisma.favorite.findMany({
    where: { memberId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const products = await productsById(favorites.map((favorite) => favorite.productId));

  return favorites
    .map((favorite) => {
      const product = products.get(favorite.productId);

      if (!product) {
        return null;
      }

      return {
        id: favorite.id,
        productId: product.id,
        name: product.name,
        slug: product.slug,
        image: getProductImageUrl(product.image),
        url: `/${product.slug}/${product.id}`,
        favoritedAt: favorite.createdAt,
      };
    })
    .filter((favorite): favorite is MemberFavorite => favorite !== null);
}

/** The member's most recent cop/drop vote per release (one per release_interest row after castVote's replace-on-vote). */
export async function getMemberVotes(memberId: number): Promise<MemberVote[]> {
  const votes = await prisma.releaseInterest.findMany({
    where: { memberId, status: { not: null } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const productIds = votes.map((vote) => vote.productId).filter((id): id is number => id !== null);
  const products = await productsById(productIds);

  return votes
    .map((vote) => {
      const product = vote.productId ? products.get(vote.productId) : null;

      if (!product || vote.status === null) {
        return null;
      }

      return {
        id: vote.id,
        productId: product.id,
        status: vote.status === 1 ? ("cop" as const) : ("drop" as const),
        name: product.name,
        slug: product.slug,
        image: getProductImageUrl(product.image),
        url: `/${product.slug}/${product.id}`,
        votedAt: vote.createdAt,
      };
    })
    .filter((vote): vote is MemberVote => vote !== null);
}

export async function getMemberComments(memberId: number): Promise<MemberComment[]> {
  const comments = await prisma.comment.findMany({
    where: { memberId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const products = await productsById(
    comments.map((comment) => comment.productId).filter((id): id is number => id !== null),
  );

  return comments.map((comment) => {
    const product = comment.productId ? products.get(comment.productId) : null;

    return {
      id: comment.id,
      productId: comment.productId,
      comment: comment.comment ?? "",
      createdAt: comment.createdAt,
      product: product ? { name: product.name, url: `/${product.slug}/${product.id}` } : null,
    };
  });
}
