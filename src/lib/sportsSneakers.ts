import { prisma } from "@/lib/prisma";
import type { LegacyRelease } from "@/lib/legacyMobileApi";
import { mapDbReleaseToLegacyRelease, type DbReleaseRow } from "@/lib/dbReleases";

// Signature and PE lines keyed by the ESPN team abbreviation the athlete plays
// for. `match` values are matched against product names, so they are the
// shorthand the release archive actually uses ("KD", "Kyrie", "LeBron").
type SignatureAthlete = {
  athlete: string;
  team: string;
  line: string;
  match: string[];
};

const signatureAthletes: SignatureAthlete[] = [
  { athlete: "LeBron James", team: "LAL", line: "Nike LeBron", match: ["lebron"] },
  { athlete: "Kevin Durant", team: "HOU", line: "Nike KD", match: ["kd "] },
  { athlete: "Giannis Antetokounmpo", team: "MIL", line: "Nike Giannis", match: ["giannis"] },
  { athlete: "Luka Doncic", team: "LAL", line: "Jordan Luka", match: ["luka"] },
  { athlete: "Jayson Tatum", team: "BOS", line: "Jordan Tatum", match: ["tatum"] },
  { athlete: "Stephen Curry", team: "GS", line: "Curry Brand", match: ["curry"] },
  { athlete: "Ja Morant", team: "MEM", line: "Nike Ja", match: ["ja morant", "nike ja "] },
  { athlete: "Zion Williamson", team: "NO", line: "Jordan Zion", match: ["zion"] },
  { athlete: "Devin Booker", team: "PHX", line: "Nike Book", match: ["book 1", "booker"] },
  { athlete: "Anthony Edwards", team: "MIN", line: "adidas AE", match: ["ae 1", "ae 2", "anthony edwards"] },
  { athlete: "Donovan Mitchell", team: "CLE", line: "adidas D.O.N.", match: ["d.o.n.", "don issue"] },
  { athlete: "Damian Lillard", team: "POR", line: "adidas Dame", match: ["dame "] },
  { athlete: "Kobe Bryant", team: "LAL", line: "Nike Kobe", match: ["kobe"] },
  { athlete: "Kyrie Irving", team: "DAL", line: "Nike Kyrie", match: ["kyrie"] },
  { athlete: "Paul George", team: "PHI", line: "Nike PG", match: ["pg 6", "pg 7", "paul george"] },
  { athlete: "Sabrina Ionescu", team: "NY", line: "Nike Sabrina", match: ["sabrina"] },
  { athlete: "A'ja Wilson", team: "LV", line: "Nike A'One", match: ["a'one", "a one"] },
  { athlete: "Michael Jordan", team: "CHI", line: "Air Jordan", match: ["air jordan"] },
];

export type SignatureMatch = {
  athlete: string;
  line: string;
  releases: LegacyRelease[];
};

export function getSignatureAthletesForTeams(abbreviations: string[]) {
  const wanted = new Set(abbreviations.filter(Boolean));

  return signatureAthletes.filter((athlete) => wanted.has(athlete.team));
}

/**
 * Pulls the newest release for every signature line tied to the teams playing
 * today, in one query rather than one per athlete.
 */
export async function getSignatureReleases(
  athletes: SignatureAthlete[],
  perLine = 3,
): Promise<SignatureMatch[]> {
  if (!athletes.length) {
    return [];
  }

  const patterns = Array.from(
    new Set(athletes.flatMap((athlete) => athlete.match.map((m) => `%${m.trim()}%`))),
  );

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
      WHERE p.name ILIKE ANY(${patterns})
      ORDER BY r.release_date DESC, p.id DESC
      LIMIT 400
    `;

    const releases = rows.map(mapDbReleaseToLegacyRelease);

    return athletes
      .map((athlete) => ({
        athlete: athlete.athlete,
        line: athlete.line,
        releases: releases
          .filter((release) =>
            athlete.match.some((needle) =>
              release.name.toLowerCase().includes(needle.trim()),
            ),
          )
          .slice(0, perLine),
      }))
      .filter((match) => match.releases.length);
  } catch (error) {
    console.warn("Unable to match signature sneakers.", error);
    return [];
  }
}

/** Releases dropping on the same calendar day as the games being shown. */
export async function getReleasesOnDate(date: Date, limit = 8) {
  const iso = date.toISOString().slice(0, 10);

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
      WHERE r.release_date::date = ${iso}::date
      ORDER BY p.name ASC
      LIMIT ${limit}
    `;

    return rows.map(mapDbReleaseToLegacyRelease);
  } catch (error) {
    console.warn("Unable to read game-day releases.", error);
    return [];
  }
}
