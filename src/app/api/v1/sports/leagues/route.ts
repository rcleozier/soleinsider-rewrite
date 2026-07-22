import { espnLeagues } from "@/lib/espn";
import { apiSuccess } from "@/lib/api/response";
import { serializeLeague } from "@/lib/api/sportsApi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/v1/sports/leagues — every supported league. */
export async function GET() {
  const leagues = espnLeagues.map(serializeLeague);

  return apiSuccess({ leagues }, { count: leagues.length }, 3600);
}
