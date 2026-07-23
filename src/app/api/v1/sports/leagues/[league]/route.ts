import { espnLeagues, findEspnLeague } from "@/lib/espn";
import { apiError, apiSuccess } from "@/lib/api/response";
import { getLeagueBoardWithSneakers, serializeGame, serializeLeague } from "@/lib/api/sportsApi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteProps = {
  params: Promise<{ league: string }>;
};

/**
 * GET /api/v1/sports/leagues/{league}
 * Scoreboard for one league plus the sneaker tie-in across every team playing.
 */
export async function GET(_request: Request, { params }: RouteProps) {
  const { league: leagueSlug } = await params;
  const league = findEspnLeague(leagueSlug);

  if (!league) {
    return apiError(`Unknown league "${leagueSlug}".`, 404, {
      availableLeagues: espnLeagues.map((entry) => entry.slug),
    });
  }

  const { games, sneakers } = await getLeagueBoardWithSneakers(league.slug);

  return apiSuccess(
    {
      league: serializeLeague(league),
      games: games.map(serializeGame),
      sneakers,
    },
    {
      gameCount: games.length,
      liveCount: games.filter((game) => game.statusState === "in").length,
      signatureAthleteCount: sneakers.signatureAthletes.length,
      gameDayReleaseCount: sneakers.releasingOnGameDay.length,
    },
    20,
  );
}
