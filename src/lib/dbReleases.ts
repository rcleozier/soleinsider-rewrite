import { prisma } from "@/lib/prisma";
import type { LegacyRelease } from "@/lib/legacyMobileApi";

type DbReleaseRow = {
  id: number;
  name: string;
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

export async function getDbSneakerReleasesDescending(limit = 120) {
  try {
    const rows = await prisma.$queryRaw<DbReleaseRow[]>`
      SELECT
        p.id,
        p.name,
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
    console.warn("Falling back to mock releases because DB releases failed.", error);
    return [];
  }
}

function mapDbReleaseToLegacyRelease(row: DbReleaseRow): LegacyRelease {
  const yesVotes = Number(row.yes_votes ?? 0);
  const noVotes = Number(row.no_votes ?? 0);
  const totalVotes = yesVotes + noVotes;
  const yesPercentage = totalVotes ? Math.round((yesVotes / totalVotes) * 100) : 0;

  return {
    id: String(row.id),
    name: row.name,
    content: row.content ?? "",
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
