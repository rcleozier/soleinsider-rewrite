import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import { getProductImageUrl } from "@/lib/productImages";

export async function getAdminStats() {
  const [memberCount, releaseCount, pendingCount, commentCount, favoriteCount] = await Promise.all([
    prisma.member.count(),
    prisma.product.count(),
    prisma.tempProduct.count({ where: { status: { notIn: ["approved", "rejected"] } } }),
    prisma.comment.count(),
    prisma.favorite.count(),
  ]);

  return { memberCount, releaseCount, pendingCount, commentCount, favoriteCount };
}

type ProductSummary = { id: number; name: string; slug: string; image: string };
type MemberSummary = { id: number; name: string | null; email: string };

async function productsById(productIds: number[]): Promise<Map<number, ProductSummary>> {
  if (!productIds.length) return new Map();

  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, slug: true, image: true },
  });

  return new Map(products.map((product) => [product.id, product]));
}

async function membersById(memberIds: number[]): Promise<Map<number, MemberSummary>> {
  if (!memberIds.length) return new Map();

  const members = await prisma.member.findMany({
    where: { id: { in: memberIds } },
    select: { id: true, name: true, email: true },
  });

  return new Map(members.map((member) => [member.id, member]));
}

export async function getRecentFavorites(limit = 8) {
  const favorites = await prisma.favorite.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const [products, members] = await Promise.all([
    productsById(favorites.map((favorite) => favorite.productId)),
    membersById(favorites.map((favorite) => favorite.memberId)),
  ]);

  return favorites.map((favorite) => {
    const product = products.get(favorite.productId);
    const member = members.get(favorite.memberId);

    return {
      id: favorite.id,
      createdAt: favorite.createdAt,
      productName: product?.name ?? "Deleted product",
      productImage: product ? getProductImageUrl(product.image) : null,
      productUrl: product ? `/${product.slug}/${product.id}` : null,
      memberName: member?.name || member?.email || "Unknown member",
    };
  });
}

export async function getRecentComments(limit = 8) {
  const comments = await prisma.comment.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const productIds = comments.map((comment) => comment.productId).filter((id): id is number => id !== null);
  const memberIds = comments.map((comment) => comment.memberId).filter((id): id is number => id !== null);

  const [products, members] = await Promise.all([productsById(productIds), membersById(memberIds)]);

  return comments.map((comment) => {
    const product = comment.productId ? products.get(comment.productId) : null;
    const member = comment.memberId ? members.get(comment.memberId) : null;

    return {
      id: comment.id,
      comment: comment.comment ?? "",
      createdAt: comment.createdAt,
      productName: product?.name ?? "Deleted product",
      productUrl: product ? `/${product.slug}/${product.id}` : null,
      memberName: member?.name || member?.email || "Unknown member",
    };
  });
}

export async function deleteComment(formData: FormData) {
  "use server";

  await requireAdmin();

  const id = Number(formData.get("id"));

  if (!Number.isFinite(id)) {
    throw new Error("Invalid comment id.");
  }

  await prisma.comment.delete({ where: { id } });

  const redirectTo = formData.get("redirectTo");
  redirect(typeof redirectTo === "string" && redirectTo ? redirectTo : "/admin");
}
