import {
  espnLeagues,
  getEspnScoreboard,
  type EspnGame,
  type EspnGameSummary,
} from "@/lib/espn";
import {
  getReleasesOnDate,
  getSignatureAthletesForTeams,
  getSignatureReleases,
} from "@/lib/sportsSneakers";
import { serializeRelease, type ApiRelease } from "@/lib/api/serializers";

export type ApiSignatureMatch = {
  athlete: string;
  line: string;
  releases: ApiRelease[];
};

export function serializeLeague(league: (typeof espnLeagues)[number]) {
  return {
    slug: league.slug,
    label: league.label,
    sport: league.sport,
    logo: league.logo,
    links: {
      scoreboard: `/api/v1/sports/leagues/${league.slug}`,
    },
  };
}

export function serializeGame(game: EspnGame) {
  const away = game.teams.find((team) => !team.isHome) ?? game.teams[0] ?? null;
  const home = game.teams.find((team) => team.isHome) ?? game.teams[1] ?? null;

  return {
    id: game.id,
    league: { slug: game.leagueSlug, label: game.league },
    name: game.detail || null,
    headline: game.headline,
    startTime: game.date || null,
    status: {
      state: game.statusState,
      detail: game.status,
      isLive: game.statusState === "in",
      isFinal: game.statusState === "post",
    },
    venue: game.venue,
    broadcast: game.broadcast,
    teams: game.teams.map((team) => serializeTeam(team, game.statusState)),
    matchup: {
      away: away ? serializeTeam(away, game.statusState) : null,
      home: home ? serializeTeam(home, game.statusState) : null,
    },
    links: {
      detail: `/api/v1/sports/games/${game.leagueSlug}/${game.id}`,
      web: `/sports/${game.leagueSlug}/${game.id}`,
    },
  };
}

function serializeTeam(
  team: EspnGame["teams"][number],
  statusState: "pre" | "in" | "post",
) {
  // ESPN sends "0" for both sides before tip-off. Passing that through as 0
  // would make every scheduled game look like a 0-0 result to the client.
  const hasScore = statusState !== "pre" && team.score !== null && team.score !== "";

  return {
    name: team.name,
    abbreviation: team.abbreviation || null,
    logo: team.logo,
    score: hasScore ? Number(team.score) : null,
    record: team.record,
    isHome: team.isHome,
  };
}

export function serializeGameSummary(summary: EspnGameSummary) {
  const away = summary.teams.find((team) => !team.isHome) ?? summary.teams[0] ?? null;
  const home = summary.teams.find((team) => team.isHome) ?? summary.teams[1] ?? null;

  return {
    id: summary.id,
    league: { slug: summary.leagueSlug, label: summary.league },
    startTime: summary.date || null,
    status: {
      state: summary.statusState,
      detail: summary.status,
      isLive: summary.statusState === "in",
      isFinal: summary.statusState === "post",
    },
    neutralSite: summary.neutralSite,
    venue: summary.venue,
    broadcasts: summary.broadcasts,
    teams: summary.teams.map((team) => serializeTeam(team, summary.statusState)),
    matchup: {
      away: away ? serializeTeam(away, summary.statusState) : null,
      home: home ? serializeTeam(home, summary.statusState) : null,
    },
    odds: summary.odds.map((line) => ({
      provider: line.provider,
      details: line.details,
      spread: line.spread,
      overUnder: line.overUnder,
      favorite: line.favorite,
      moneyline: { home: line.homeMoneyLine, away: line.awayMoneyLine },
    })),
    leaders: summary.leaders,
    injuries: summary.injuries,
    lastFive: summary.lastFive,
    tickets: summary.tickets,
    links: {
      web: `/sports/${summary.leagueSlug}/${summary.id}`,
    },
  };
}

/**
 * The sneaker tie-in the web pages render, shaped for the API: signature lines
 * belonging to the teams involved, plus anything releasing that same day.
 * `perLine` is kept small for list endpoints and larger for a single game.
 */
export async function buildSneakerTieIn({
  teamAbbreviations,
  leagueSlug,
  date,
  perLine = 3,
  dropLimit = 8,
}: {
  teamAbbreviations: string[];
  leagueSlug: string;
  date: Date;
  perLine?: number;
  dropLimit?: number;
}) {
  const athletes = getSignatureAthletesForTeams(teamAbbreviations, leagueSlug);

  const [signatures, gameDayDrops] = await Promise.all([
    getSignatureReleases(athletes, perLine),
    getReleasesOnDate(date, dropLimit),
  ]);

  return {
    signatureAthletes: signatures.map((match) => ({
      athlete: match.athlete,
      line: match.line,
      releases: match.releases.map((release) => serializeRelease(release)),
    })) satisfies ApiSignatureMatch[],
    releasingOnGameDay: gameDayDrops.map((release) => serializeRelease(release)),
  };
}

/** Scoreboard + a league-wide sneaker tie-in across every team playing. */
export async function getLeagueBoardWithSneakers(leagueSlug: string) {
  const games = await getEspnScoreboard(leagueSlug);
  const teamAbbreviations = games.flatMap((game) =>
    game.teams.map((team) => team.abbreviation),
  );

  const sneakers = await buildSneakerTieIn({
    teamAbbreviations,
    leagueSlug,
    date: new Date(),
  });

  return { games, sneakers };
}
