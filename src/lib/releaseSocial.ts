import { prisma } from "@/lib/prisma";

export type CommentWithAuthor = {
  id: number;
  productId: number;
  comment: string;
  author: string;
  createdAt: Date | null;
};

export async function listComments(productId: number, limit = 30) {
  const comments = await prisma.comment.findMany({
    where: { productId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit,
  });

  const memberIds = Array.from(
    new Set(comments.map((comment) => comment.memberId).filter((id): id is number => Boolean(id))),
  );
  const members = memberIds.length
    ? await prisma.member.findMany({ where: { id: { in: memberIds } }, select: { id: true, name: true } })
    : [];
  const namesById = new Map(members.map((member) => [member.id, member.name]));

  return comments.map((comment): CommentWithAuthor => ({
    id: comment.id,
    productId: comment.productId ?? productId,
    comment: comment.comment ?? "",
    author: (comment.memberId ? namesById.get(comment.memberId) : null) || "SoleInsider member",
    createdAt: comment.createdAt,
  }));
}

export async function createComment(memberId: number, productId: number, text: string) {
  const trimmed = text.trim();

  if (trimmed.length < 2) {
    throw new Error("Comment is too short.");
  }

  if (trimmed.length > 500) {
    throw new Error("Comment is too long (500 characters max).");
  }

  const now = new Date();

  return prisma.comment.create({
    data: {
      memberId,
      productId,
      comment: trimmed,
      votesUp: 0,
      votesDown: 0,
      createdAt: now,
      updatedAt: now,
    },
  });
}

export async function addFavorite(memberId: number, productId: number) {
  await prisma.favorite.upsert({
    where: { memberId_productId: { memberId, productId } },
    update: {},
    create: { memberId, productId },
  });
}

export async function removeFavorite(memberId: number, productId: number) {
  await prisma.favorite.deleteMany({ where: { memberId, productId } });
}

export async function isFavorited(memberId: number, productId: number) {
  const favorite = await prisma.favorite.findUnique({
    where: { memberId_productId: { memberId, productId } },
  });

  return Boolean(favorite);
}

export type VoteStatus = "cop" | "drop";

const VOTE_STATUS_TO_DB: Record<VoteStatus, number> = { cop: 1, drop: 0 };
const DB_STATUS_TO_VOTE: Record<number, VoteStatus> = { 1: "cop", 0: "drop" };

/**
 * One active vote per member per product. release_interest has no unique
 * constraint (legacy anonymous rows all share member_id 0), so "replace" is
 * done in application code: delete this member's prior vote on this product,
 * then insert the new one, inside a transaction.
 */
export async function castVote(memberId: number, productId: number, status: VoteStatus) {
  await prisma.$transaction([
    prisma.releaseInterest.deleteMany({ where: { memberId, productId } }),
    prisma.releaseInterest.create({
      data: {
        memberId,
        productId,
        status: VOTE_STATUS_TO_DB[status],
        createdAt: new Date(),
      },
    }),
  ]);
}

export async function getMemberVote(memberId: number, productId: number): Promise<VoteStatus | null> {
  const vote = await prisma.releaseInterest.findFirst({
    where: { memberId, productId },
    orderBy: { id: "desc" },
  });

  if (!vote || vote.status === null) {
    return null;
  }

  return DB_STATUS_TO_VOTE[vote.status] ?? null;
}
