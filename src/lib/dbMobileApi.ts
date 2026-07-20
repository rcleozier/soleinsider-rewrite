import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  getDbProductComments,
  getDbProductImages,
  getDbReleasesOnMonthDay,
  mapDbReleaseToLegacyRelease,
  recordDbCopDropVote,
  type DbReleaseRow,
} from "@/lib/dbReleases";
import type { LegacyPostBody, LegacyRelease } from "@/lib/legacyMobileApi";
import { getProductImageUrl } from "@/lib/productImages";

type DbCommentVoteRow = {
  product_id: number | null;
};

type DbTokenRow = {
  id: number;
  application: string | null;
  token: string | null;
};

type ReleaseOrder =
  | "created_desc"
  | "release_asc"
  | "release_desc"
  | "most_liked"
  | "most_sales"
  | "most_profit"
  | "random";

export async function getDbReleaseDatesUnformatted(type = "sneakers", limit = 500) {
  return getDbReleaseList({ type, order: "release_asc", limit });
}

export async function getDbCombinedReleaseDates(limit = 500) {
  return getDbReleaseList({ types: ["sneakers", "clothing"], order: "release_asc", limit });
}

export async function getDbUpcomingReleases(limit = 500) {
  return getDbReleaseList({
    types: ["sneakers", "clothing"],
    order: "release_asc",
    limit,
    releaseFrom: new Date(),
  });
}

export async function getDbPastReleaseDates(limit = 35) {
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  twoDaysAgo.setHours(0, 0, 0, 0);

  return getDbReleaseList({
    type: "sneakers",
    order: "release_desc",
    limit,
    releaseBefore: twoDaysAgo,
  });
}

export async function getDbRecentlyAddedReleases(limit = 20) {
  return getDbReleaseList({ type: "sneakers", order: "created_desc", limit });
}

export async function getDbProducts(limit = 20) {
  return getDbReleaseList({ type: "sneakers", order: "created_desc", limit });
}

export async function getDbRandomProduct() {
  const releases = await getDbReleaseList({ type: "sneakers", order: "random", limit: 1 });
  return releases[0] ?? null;
}

export async function getDbProduct(productId: string | null) {
  const numericProductId = Number.parseInt(productId ?? "", 10);

  if (!Number.isFinite(numericProductId)) {
    return [];
  }

  const rows = await prisma.$queryRaw<DbReleaseRow[]>`
    SELECT
      p.id,
      p.name,
      p.description,
      p.content,
      p.sku,
      p.image,
      p.link,
      p.slug,
      p.price,
      p.views,
      p.type,
      p.stockx_highest_bid,
      p.stockx_total_dollars,
      p.stockx_lowest_ask,
      p.stockx_last_sale,
      p.stockx_deadstock_sold,
      p.stockx_sales_last_72,
      r.release_date AS release_date_raw,
      p.created_at,
      p.id AS product_id,
      COALESCE(yes_votes.yes_votes, 0) AS yes_votes,
      COALESCE(no_votes.no_votes, 0) AS no_votes
    FROM products p
    INNER JOIN releases r ON r.product_id = p.id
    LEFT JOIN (
      SELECT product_id, COUNT(status) AS yes_votes
      FROM release_interest
      WHERE status = 1
      GROUP BY product_id
    ) yes_votes ON yes_votes.product_id = p.id
    LEFT JOIN (
      SELECT product_id, COUNT(status) AS no_votes
      FROM release_interest
      WHERE status = 0
      GROUP BY product_id
    ) no_votes ON no_votes.product_id = p.id
    WHERE p.id = ${numericProductId}
    LIMIT 1
  `;

  return rows.map(toMobileRelease);
}

export async function searchDbReleases(search: string | null, limit = 60) {
  const needle = search?.trim();

  if (!needle) {
    return [];
  }

  const pattern = `%${needle}%`;
  const rows = await prisma.$queryRaw<DbReleaseRow[]>`
    SELECT
      p.id,
      p.name,
      p.description,
      p.content,
      p.sku,
      p.image,
      p.link,
      p.slug,
      p.price,
      p.views,
      p.type,
      p.stockx_highest_bid,
      p.stockx_total_dollars,
      p.stockx_lowest_ask,
      p.stockx_last_sale,
      p.stockx_deadstock_sold,
      p.stockx_sales_last_72,
      r.release_date AS release_date_raw,
      p.created_at,
      p.id AS product_id,
      COALESCE(yes_votes.yes_votes, 0) AS yes_votes,
      COALESCE(no_votes.no_votes, 0) AS no_votes
    FROM products p
    INNER JOIN releases r ON r.product_id = p.id
    LEFT JOIN (
      SELECT product_id, COUNT(status) AS yes_votes
      FROM release_interest
      WHERE status = 1
      GROUP BY product_id
    ) yes_votes ON yes_votes.product_id = p.id
    LEFT JOIN (
      SELECT product_id, COUNT(status) AS no_votes
      FROM release_interest
      WHERE status = 0
      GROUP BY product_id
    ) no_votes ON no_votes.product_id = p.id
    WHERE p.type = 'sneakers'
      AND (
        p.name ILIKE ${pattern}
        OR p.sku ILIKE ${pattern}
        OR p.slug ILIKE ${pattern}
        OR COALESCE(p.content, '') ILIKE ${pattern}
        OR COALESCE(p.description, '') ILIKE ${pattern}
      )
    ORDER BY p.created_at DESC, p.id DESC
    LIMIT ${Math.max(1, Math.min(limit, 120))}
  `;

  return rows.map(toMobileRelease);
}

export async function getDbReleasesForStaticParams(limit = 5000) {
  return getDbReleaseList({ type: "sneakers", order: "created_desc", limit });
}

export async function getDbReleasesOnLegacyDate(date: string | null) {
  const normalizedDate = date || formatMonthDay(new Date());
  const match = normalizedDate.match(/^(\d{2})-(\d{2})$/);

  if (!match) {
    return [];
  }

  const [, month, day] = match.map(Number);
  return (await getDbReleasesOnMonthDay(month, day)) ?? [];
}

export async function getDbSlideshow(productId: string | null) {
  if (!productId) {
    return [];
  }

  const images = await getDbProductImages(productId, null);

  return images.map((imageUrl, index) => ({
    id: String(index + 1),
    product_id: productId,
    optimized: "1",
    image: imageUrl,
    image_url: imageUrl,
  }));
}

export async function getDbComments(productId: string | null) {
  if (!productId) {
    return [];
  }

  const comments = await getDbProductComments(productId);

  return comments.map((comment) => ({
    id: comment.id,
    member_id: "0",
    product_id: productId,
    comment: comment.comment,
    votes_up: comment.votes_up,
    votes_down: "0",
    created_at: comment.comment_date,
    updated_at: comment.comment_date,
    email: null,
    password: null,
    phone_number: null,
    carrier: null,
    member_type: null,
    verified: null,
    profile_image: null,
    bounced_email: null,
    comment_date: comment.comment_date,
  }));
}

export async function leaveDbComment(body: LegacyPostBody) {
  const productId = Number.parseInt(body.product_id || "", 10);
  const comment = (body.comment || body.body || "").trim();
  const memberId = Number.parseInt(body.member_id || "0", 10) || 0;

  if (!Number.isFinite(productId) || comment.length < 2 || comment === "undefined") {
    return false;
  }

  await prisma.comment.create({
    data: {
      memberId,
      productId,
      comment,
      votesUp: 1,
      votesDown: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  return true;
}

export async function voteDbComment(body: LegacyPostBody) {
  const productId = Number.parseInt(body.product_id || "", 10);
  const commentId = Number.parseInt(body.comment_id || "", 10);
  const commentVote = (body.comment_vote || "").trim().toLowerCase();

  if (!Number.isFinite(productId) || !Number.isFinite(commentId)) {
    return [];
  }

  const [comment] = await prisma.$queryRaw<DbCommentVoteRow[]>`
    SELECT product_id
    FROM comments
    WHERE id = ${commentId}
      AND product_id = ${productId}
    LIMIT 1
  `;

  if (!comment) {
    return getDbComments(String(productId));
  }

  if (commentVote === "0" || commentVote === "down" || commentVote === "drop") {
    await prisma.comment.update({
      where: { id: commentId },
      data: { votesDown: { increment: 1 } },
    });
  } else {
    await prisma.comment.update({
      where: { id: commentId },
      data: { votesUp: { increment: 1 } },
    });
  }

  return getDbComments(String(productId));
}

export async function copOrNotDb(body: LegacyPostBody) {
  const result = await recordDbCopDropVote(
    body.product_id || "",
    body.status || "",
    body.member_id || "0",
  );

  return Boolean(result);
}

export async function getDbStatsMostSales() {
  return getDbReleaseList({ type: "sneakers", order: "most_sales", limit: 50 });
}

export async function getDbStatsMostProfit() {
  const releases = await getDbReleaseList({ type: "sneakers", order: "most_profit", limit: 25 });

  return releases.map((release) => ({
    ...release,
    profit: String(Number(release.stockx_lowest_ask) - Number(release.price)),
  }));
}

export async function getDbStatsMostLiked() {
  return getDbReleaseList({ type: "sneakers", order: "most_liked", limit: 35 });
}

export async function saveDbToken(body: LegacyPostBody) {
  const token = (body.token || "").trim();
  const application = (body.application || "").trim();

  if (!token) {
    return false;
  }

  try {
    await prisma.$executeRaw`
      INSERT INTO tokens (application, token)
      VALUES (${application}, ${token})
      ON CONFLICT DO NOTHING
    `;
    return true;
  } catch (error) {
    console.warn("Unable to save token to DB.", error);
    return false;
  }
}

export async function getDbTokens(body: LegacyPostBody) {
  const application = (body.application || "").trim();

  try {
    const rows = await prisma.$queryRaw<DbTokenRow[]>`
      SELECT id, application, token
      FROM tokens
      WHERE application = ${application}
      ORDER BY id DESC
      LIMIT 1000
    `;

    return rows.map((row) => ({
      id: String(row.id),
      application: row.application ?? "",
      token: row.token ?? "",
    }));
  } catch (error) {
    console.warn("Unable to read tokens from DB.", error);
    return [];
  }
}

export function emptyLegacyCollection() {
  return [];
}

export function showDbBanner() {
  return false;
}

async function getDbReleaseList({
  type,
  types,
  order,
  limit,
  releaseFrom,
  releaseBefore,
}: {
  type?: string;
  types?: string[];
  order: ReleaseOrder;
  limit: number;
  releaseFrom?: Date;
  releaseBefore?: Date;
}) {
  const boundedLimit = Math.max(1, Math.min(limit, 5000));
  const allowedTypes = types ?? (type ? [type] : ["sneakers"]);
  const rows = await runReleaseListQuery(
    Prisma.join(allowedTypes),
    order,
    boundedLimit,
    releaseFrom,
    releaseBefore,
  );

  return rows.map(toMobileRelease);
}

function runReleaseListQuery(
  types: Prisma.Sql,
  order: ReleaseOrder,
  limit: number,
  releaseFrom?: Date,
  releaseBefore?: Date,
) {
  if (order === "release_asc") {
    return prisma.$queryRaw<DbReleaseRow[]>`
      SELECT ${releaseSelectSql()}
      FROM products p
      INNER JOIN releases r ON r.product_id = p.id
      ${voteJoinsSql()}
      WHERE p.type IN (${types})
        AND (${releaseFrom ?? null}::timestamp IS NULL OR r.release_date >= ${releaseFrom ?? null}::timestamp)
        AND (${releaseBefore ?? null}::timestamp IS NULL OR r.release_date < ${releaseBefore ?? null}::timestamp)
      ORDER BY r.release_date ASC, p.name ASC
      LIMIT ${limit}
    `;
  }

  if (order === "release_desc") {
    return prisma.$queryRaw<DbReleaseRow[]>`
      SELECT ${releaseSelectSql()}
      FROM products p
      INNER JOIN releases r ON r.product_id = p.id
      ${voteJoinsSql()}
      WHERE p.type IN (${types})
        AND (${releaseFrom ?? null}::timestamp IS NULL OR r.release_date >= ${releaseFrom ?? null}::timestamp)
        AND (${releaseBefore ?? null}::timestamp IS NULL OR r.release_date < ${releaseBefore ?? null}::timestamp)
      ORDER BY r.release_date DESC, p.name ASC
      LIMIT ${limit}
    `;
  }

  if (order === "most_liked") {
    return prisma.$queryRaw<DbReleaseRow[]>`
      SELECT ${releaseSelectSql()}
      FROM products p
      INNER JOIN releases r ON r.product_id = p.id
      ${voteJoinsSql()}
      WHERE p.type IN (${types})
      ORDER BY COALESCE(yes_votes.yes_votes, 0) DESC, p.created_at DESC
      LIMIT ${limit}
    `;
  }

  if (order === "most_sales") {
    return prisma.$queryRaw<DbReleaseRow[]>`
      SELECT ${releaseSelectSql()}
      FROM products p
      INNER JOIN releases r ON r.product_id = p.id
      ${voteJoinsSql()}
      WHERE p.type IN (${types})
        AND p.stockx_lowest_ask > 0
      ORDER BY p.stockx_sales_last_72 DESC, p.created_at DESC
      LIMIT ${limit}
    `;
  }

  if (order === "most_profit") {
    return prisma.$queryRaw<DbReleaseRow[]>`
      SELECT ${releaseSelectSql()}
      FROM products p
      INNER JOIN releases r ON r.product_id = p.id
      ${voteJoinsSql()}
      WHERE p.type IN (${types})
        AND p.stockx_lowest_ask > 0
      ORDER BY (p.stockx_lowest_ask - p.price) DESC, p.created_at DESC
      LIMIT ${limit}
    `;
  }

  if (order === "random") {
    return prisma.$queryRaw<DbReleaseRow[]>`
      SELECT ${releaseSelectSql()}
      FROM products p
      INNER JOIN releases r ON r.product_id = p.id
      ${voteJoinsSql()}
      WHERE p.type IN (${types})
      ORDER BY RANDOM()
      LIMIT ${limit}
    `;
  }

  return prisma.$queryRaw<DbReleaseRow[]>`
    SELECT ${releaseSelectSql()}
    FROM products p
    INNER JOIN releases r ON r.product_id = p.id
    ${voteJoinsSql()}
    WHERE p.type IN (${types})
    ORDER BY p.created_at DESC, p.id DESC
    LIMIT ${limit}
  `;
}

function releaseSelectSql() {
  return Prisma.sql`
    p.id,
    p.name,
    p.description,
    p.content,
    p.sku,
    p.image,
    p.link,
    p.slug,
    p.price,
    p.views,
    p.type,
    p.stockx_highest_bid,
    p.stockx_total_dollars,
    p.stockx_lowest_ask,
    p.stockx_last_sale,
    p.stockx_deadstock_sold,
    p.stockx_sales_last_72,
    r.release_date AS release_date_raw,
    p.created_at,
    p.id AS product_id,
    COALESCE(yes_votes.yes_votes, 0) AS yes_votes,
    COALESCE(no_votes.no_votes, 0) AS no_votes
  `;
}

function voteJoinsSql() {
  return Prisma.sql`
    LEFT JOIN (
      SELECT product_id, COUNT(status) AS yes_votes
      FROM release_interest
      WHERE status = 1
      GROUP BY product_id
    ) yes_votes ON yes_votes.product_id = p.id
    LEFT JOIN (
      SELECT product_id, COUNT(status) AS no_votes
      FROM release_interest
      WHERE status = 0
      GROUP BY product_id
    ) no_votes ON no_votes.product_id = p.id
  `;
}

function toMobileRelease(row: DbReleaseRow): LegacyRelease {
  const release = mapDbReleaseToLegacyRelease(row);

  return {
    ...release,
    image_url: getProductImageUrl(release.image),
    product_url: `https://soleinsider.com/${release.slug}/${release.product_id}`,
  };
}

function formatMonthDay(date: Date) {
  return `${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}
