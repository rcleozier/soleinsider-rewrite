import { espnLeagues, findEspnLeague, getEspnGameSummary } from "@/lib/espn";
import { apiError, apiSuccess } from "@/lib/api/response";
import { buildSneakerTieIn, serializeGameSummary, serializeLeague } from "@/lib/api/sportsApi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteProps = {
  params: Promise<{ league: string; gameId: string }>;
};

/**
 * GET /api/v1/sports/games/{league}/{gameId}
 * Full match detail — odds, venue, leaders, injuries, form, tickets — plus the
 * sneaker tie-in scoped to the two teams in this game.
 */
export async function GET(_request: Request, { params }: RouteProps) {
  const { league: leagueSlug, gameId } = await params;
  const league = findEspnLeague(leagueSlug);

  if (!league) {
    return apiError(`Unknown league "${leagueSlug}".`, 404, {
      availableLeagues: espnLeagues.map((entry) => entry.slug),
    });
  }

  const summary = await getEspnGameSummary(league.slug, gameId);

  if (!summary) {
    return apiError(`Game "${gameId}" was not found in ${league.label}.`, 404);
  }

  // A single game can afford deeper per-athlete results than the list view.
  const sneakers = await buildSneakerTieIn({
    teamAbbreviations: summary.teams.map((team) => team.abbreviation),
    leagueSlug: league.slug,
    date: summary.date ? new Date(summary.date) : new Date(),
    perLine: 6,
    dropLimit: 12,
  });

  return apiSuccess(
    {
      league: serializeLeague(league),
      game: serializeGameSummary(summary),
      sneakers,
    },
    {
      hasOdds: summary.odds.length > 0,
      signatureAthleteCount: sneakers.signatureAthletes.length,
      gameDayReleaseCount: sneakers.releasingOnGameDay.length,
    },
    30,
  );
}
