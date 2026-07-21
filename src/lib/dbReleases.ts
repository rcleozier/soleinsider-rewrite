import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { LegacyRelease } from "@/lib/legacyMobileApi";
import { getProductImageUrl } from "@/lib/productImages";
import { getBrandName } from "@/lib/siteData";

export type DbReleaseRow = {
  id: number;
  name: string;
  description: string | null;
  content: string | null;
  sku: string;
  image: string;
  link: string;
  slug: string;
  price: unknown;
  views: number;
  type: string;
  stockx_highest_bid: number;
  stockx_total_dollars: number;
  stockx_lowest_ask: number;
  stockx_last_sale: number;
  stockx_deadstock_sold: number;
  stockx_sales_last_72: number;
  release_date_raw: Date;
  created_at: Date;
  product_id: number;
  yes_votes: bigint | number | null;
  no_votes: bigint | number | null;
};

export type ProductDetailComment = {
  id: string;
  comment: string | null;
  comment_date: string | null;
  votes_up: string;
};

export type ProductDetailData = {
  release: LegacyRelease;
  images: string[];
  comments: ProductDetailComment[];
  relatedProducts: LegacyRelease[];
};

type DbCommentRow = {
  id: number;
  comment: string | null;
  votes_up: number | null;
  created_at: Date | null;
};

type DbProductImageRow = {
  id: number;
  image: string | null;
};

export async function getDbSneakerReleasesDescending(limit = 120) {
  try {
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
      FROM releases r
      INNER JOIN products p ON p.id = r.product_id
      LEFT JOIN (
        SELECT product_id, COUNT(status) AS yes_votes
        FROM release_interest
        WHERE status = 1
        GROUP BY product_id
      ) yes_votes ON yes_votes.product_id = r.product_id
      LEFT JOIN (
        SELECT product_id, COUNT(status) AS no_votes
        FROM release_interest
        WHERE status = 0
        GROUP BY product_id
      ) no_votes ON no_votes.product_id = r.product_id
      WHERE p.type = 'sneakers'
      ORDER BY r.release_date DESC
      LIMIT ${limit}
    `;

    return rows.map(mapDbReleaseToLegacyRelease);
  } catch (error) {
    console.warn("Unable to read DB releases.", error);
    return [];
  }
}

export const getDbSneakerReleasesRecentlyAdded = unstable_cache(
  getDbSneakerReleasesRecentlyAddedUncached,
  ["db-sneaker-releases-recently-added"],
  { revalidate: 300 },
);

async function getDbSneakerReleasesRecentlyAddedUncached(limit = 120) {
  try {
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
      ORDER BY p.created_at DESC, p.id DESC
      LIMIT ${limit}
    `;

    return rows.map(mapDbReleaseToLegacyRelease);
  } catch (error) {
    console.warn("Unable to read DB recently added releases.", error);
    return [];
  }
}

export async function searchDbReleasesForPage(search: string, limit = 60) {
  const needle = search.trim();

  if (!needle) {
    return [];
  }

  const pattern = `%${needle}%`;

  try {
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
      WHERE p.name ILIKE ${pattern}
        OR p.sku ILIKE ${pattern}
        OR p.slug ILIKE ${pattern}
      ORDER BY r.release_date DESC, p.id DESC
      LIMIT ${Math.max(1, Math.min(limit, 120))}
    `;

    return rows.map(mapDbReleaseToLegacyRelease);
  } catch (error) {
    console.warn("Unable to run DB release search.", error);
    return [];
  }
}

export async function getDbUpcomingReleases(limit = 20) {
  try {
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
      FROM releases r
      INNER JOIN products p ON p.id = r.product_id
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
        AND r.release_date >= CURRENT_DATE
      ORDER BY r.release_date ASC, p.name ASC
      LIMIT ${limit}
    `;

    return rows.map(mapDbReleaseToLegacyRelease);
  } catch (error) {
    console.warn("Unable to read DB upcoming releases.", error);
    return [];
  }
}

export async function getDbCalendarReleases(limit = 360) {
  try {
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
      FROM releases r
      INNER JOIN products p ON p.id = r.product_id
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
      ORDER BY r.release_date ASC, p.name ASC
      LIMIT ${limit}
    `;

    return rows.map(mapDbReleaseToLegacyRelease);
  } catch (error) {
    console.warn("Unable to read DB calendar releases.", error);
    return [];
  }
}

export async function getDbReleasesOnMonthDay(month: number, day: number, limit = 120) {
  if (!Number.isInteger(month) || !Number.isInteger(day) || month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  try {
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
      FROM releases r
      INNER JOIN products p ON p.id = r.product_id
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
        AND EXTRACT(MONTH FROM r.release_date) = ${month}
        AND EXTRACT(DAY FROM r.release_date) = ${day}
      ORDER BY r.release_date DESC, p.name ASC
      LIMIT ${Math.max(1, Math.min(limit, 240))}
    `;

    return rows.map(mapDbReleaseToLegacyRelease);
  } catch (error) {
    console.warn("Unable to read DB on-this-day releases.", error);
    return null;
  }
}

export async function getDbReleaseBySlugAndId(slug: string, productId: string) {
  const numericProductId = Number.parseInt(productId, 10);

  if (!slug || !Number.isFinite(numericProductId)) {
    return null;
  }

  try {
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
      WHERE p.slug = ${slug}
        AND p.id = ${numericProductId}
      LIMIT 1
    `;

    return rows[0] ? mapDbReleaseToLegacyRelease(rows[0]) : null;
  } catch (error) {
    console.warn("Unable to read DB release detail.", error);
    return null;
  }
}

export async function getDbReleaseBySlug(slug: string) {
  if (!slug) {
    return null;
  }

  try {
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
      WHERE p.slug = ${slug}
      ORDER BY r.release_date DESC
      LIMIT 1
    `;

    return rows[0] ? mapDbReleaseToLegacyRelease(rows[0]) : null;
  } catch (error) {
    console.warn("Unable to read DB release by slug.", error);
    return null;
  }
}

export async function getDbProductImages(productId: string, primaryImage: string | null | undefined) {
  const numericProductId = Number.parseInt(productId, 10);
  const images = new Set<string>();

  if (primaryImage) {
    images.add(getProductImageUrl(primaryImage));
  }

  if (!Number.isFinite(numericProductId)) {
    return Array.from(images);
  }

  try {
    const rows = await prisma.$queryRaw<DbProductImageRow[]>`
      SELECT id, image
      FROM product_images
      WHERE product_id = ${numericProductId}
      ORDER BY optimized DESC, id ASC
    `;

    for (const row of rows) {
      if (row.image) {
        images.add(getProductImageUrl(row.image));
      }
    }
  } catch (error) {
    console.warn("Using primary product image because DB product images failed.", error);
  }

  if (!images.size) {
    images.add(getProductImageUrl(null));
  }

  return Array.from(images);
}

export async function getDbProductComments(productId: string) {
  const numericProductId = Number.parseInt(productId, 10);

  if (!Number.isFinite(numericProductId)) {
    return [];
  }

  try {
    const rows = await prisma.$queryRaw<DbCommentRow[]>`
      SELECT id, comment, votes_up, created_at
      FROM comments
      WHERE product_id = ${numericProductId}
      ORDER BY created_at DESC NULLS LAST, id DESC
      LIMIT 30
    `;

    return rows.map((row) => ({
      id: String(row.id),
      comment: row.comment,
      comment_date: row.created_at ? formatLegacyCommentDate(row.created_at) : null,
      votes_up: String(row.votes_up ?? 0),
    }));
  } catch (error) {
    console.warn("Unable to read DB comments.", error);
    return [];
  }
}

export async function getDbRelatedReleases(currentRelease: LegacyRelease, limit = 8) {
  const numericProductId = Number.parseInt(currentRelease.product_id, 10);
  const releaseDate = parseLegacyCalendarDate(currentRelease.release_date_calendar);
  const boundedLimit = Math.max(1, Math.min(limit, 12));

  if (!Number.isFinite(numericProductId) || !releaseDate) {
    return [];
  }

  const brandName = getBrandName(currentRelease);
  const brandNeedle = brandName === "Sneakers" ? "" : `%${brandName}%`;

  try {
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
        AND p.id <> ${numericProductId}
      ORDER BY
        CASE
          WHEN ${brandNeedle} <> '' AND p.name ILIKE ${brandNeedle}
            AND ABS(EXTRACT(EPOCH FROM (r.release_date - ${releaseDate}::timestamp))) <= 7776000
          THEN 0
          WHEN ${brandNeedle} <> '' AND p.name ILIKE ${brandNeedle}
          THEN 1
          ELSE 2
        END ASC,
        ABS(EXTRACT(EPOCH FROM (r.release_date - ${releaseDate}::timestamp))) ASC,
        r.release_date DESC
      LIMIT ${boundedLimit}
    `;

    return rows.map(mapDbReleaseToLegacyRelease);
  } catch (error) {
    console.warn("Unable to read DB related releases.", error);
    return [];
  }
}

export async function getDbVoteSummary(productId: string) {
  const numericProductId = Number.parseInt(productId, 10);

  if (!Number.isFinite(numericProductId)) {
    return null;
  }

  try {
    const [summary] = await prisma.$queryRaw<
      { yes_votes: bigint | number; no_votes: bigint | number }[]
    >`
      SELECT
        COUNT(*) FILTER (WHERE status = 1) AS yes_votes,
        COUNT(*) FILTER (WHERE status = 0) AS no_votes
      FROM release_interest
      WHERE product_id = ${numericProductId}
    `;

    return buildVoteSummary(summary?.yes_votes ?? 0, summary?.no_votes ?? 0);
  } catch (error) {
    console.warn("Unable to read DB vote summary.", error);
    return null;
  }
}

export async function recordDbCopDropVote(productId: string, status: string, memberId = "0") {
  const numericProductId = Number.parseInt(productId, 10);
  const normalizedStatus = normalizeVoteStatus(status);

  if (!Number.isFinite(numericProductId) || normalizedStatus == null) {
    return null;
  }

  try {
    await prisma.releaseInterest.create({
      data: {
        productId: numericProductId,
        memberId: Number.parseInt(memberId, 10) || 0,
        status: normalizedStatus,
        createdAt: new Date(),
      },
    });

    return getDbVoteSummary(productId);
  } catch (error) {
    console.warn("Unable to persist DB COP/DROP vote.", error);
    return null;
  }
}

export function mapDbReleaseToLegacyRelease(row: DbReleaseRow): LegacyRelease {
  const yesVotes = Number(row.yes_votes ?? 0);
  const noVotes = Number(row.no_votes ?? 0);
  const totalVotes = yesVotes + noVotes;
  const yesPercentage = totalVotes ? Math.round((yesVotes / totalVotes) * 100) : 0;

  return {
    id: String(row.id),
    name: row.name,
    content: row.content || row.description || "",
    sku: row.sku,
    image: row.image,
    link: row.link,
    slug: row.slug,
    price: String(row.price),
    views: String(row.views),
    type: row.type,
    stockx_highest_bid: String(row.stockx_highest_bid),
    stockx_total_dollars: String(row.stockx_total_dollars),
    stockx_lowest_ask: String(row.stockx_lowest_ask),
    stockx_last_sale: String(row.stockx_last_sale),
    stockx_deadstock_sold: String(row.stockx_deadstock_sold),
    stockx_sales_last_72: String(row.stockx_sales_last_72),
    release_date: formatLegacyReleaseDate(row.release_date_raw),
    created_at: formatSqlDateTime(row.created_at),
    product_id: String(row.product_id),
    release_date_calendar: formatLegacyCalendarDate(row.release_date_raw),
    yes_votes: String(yesVotes),
    no_votes: String(noVotes),
    total_votes: String(totalVotes),
    yes_percentage: String(yesPercentage),
    no_percentage: String(totalVotes ? 100 - yesPercentage : 0),
  };
}

function buildVoteSummary(yesVotesValue: bigint | number, noVotesValue: bigint | number) {
  const yesVotes = Number(yesVotesValue ?? 0);
  const noVotes = Number(noVotesValue ?? 0);
  const totalVotes = yesVotes + noVotes;
  const yesPercentage = totalVotes ? Math.round((yesVotes / totalVotes) * 100) : 0;

  return {
    yes_votes: String(yesVotes),
    no_votes: String(noVotes),
    total_votes: String(totalVotes),
    yes_percentage: String(yesPercentage),
    no_percentage: String(totalVotes ? 100 - yesPercentage : 0),
  };
}

function normalizeVoteStatus(status: string) {
  const normalized = status.trim().toLowerCase();

  if (normalized === "1" || normalized === "cop" || normalized === "yes") {
    return 1;
  }

  if (normalized === "0" || normalized === "drop" || normalized === "no") {
    return 0;
  }

  return null;
}

function parseLegacyCalendarDate(value: string) {
  const match = value.match(
    /^(\d{4}),(\d{1,2}),(\d{1,2})\s+(\d{2}):(\d{2}):(\d{2})/,
  );

  if (!match) {
    return null;
  }

  const [, year, month, day, hour, minute, second] = match.map(Number);
  return new Date(year, month - 1, day, hour, minute, second);
}

function formatLegacyCommentDate(date: Date) {
  return `${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}-${date.getFullYear()} ${String(date.getHours()).padStart(
    2,
    "0",
  )}:${String(date.getMinutes()).padStart(2, "0")}:${String(date.getSeconds()).padStart(
    2,
    "0",
  )}`;
}

function formatLegacyCalendarDate(date: Date) {
  return `${date.getFullYear()},${date.getMonth() + 1},${date.getDate()} 08:00:00`;
}

function formatLegacyReleaseDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
    .format(date)
    .replace(/(\d+),/, (day) => `${day.replace(",", ordinalSuffix(Number.parseInt(day, 10)))},`);
}

function ordinalSuffix(day: number) {
  if (day % 100 >= 11 && day % 100 <= 13) return "th";

  return day % 10 === 1 ? "st" : day % 10 === 2 ? "nd" : day % 10 === 3 ? "rd" : "th";
}

function formatSqlDateTime(date: Date) {
  return date.toISOString().slice(0, 19).replace("T", " ");
}
