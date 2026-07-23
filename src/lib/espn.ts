// Thin reader over ESPN's public site API. It is undocumented and unversioned,
// so every field is treated as optional and failures degrade to an empty board.

export type EspnTeam = {
  name: string;
  abbreviation: string;
  logo: string | null;
  score: string | null;
  record: string | null;
  isHome: boolean;
};

export type EspnGame = {
  id: string;
  league: string;
  leagueSlug: string;
  date: string;
  status: string;
  statusState: "pre" | "in" | "post";
  detail: string;
  venue: string | null;
  broadcast: string | null;
  teams: EspnTeam[];
  headline: string | null;
};

// Logo hrefs come from each league's ESPN scoreboard `leagues[0].logos`. The
// three NCAA entries have no distinct league badge on ESPN, only a generic
// sport icon, so NCAAM/NCAAW share the basketball icon and NCAAF uses the
// college-football icon.
export const espnLeagues = [
  {
    slug: "nba",
    sport: "basketball",
    label: "NBA",
    logo: "https://a.espncdn.com/i/teamlogos/leagues/500/nba.png",
  },
  {
    slug: "nfl",
    sport: "football",
    label: "NFL",
    logo: "https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png",
  },
  {
    slug: "mlb",
    sport: "baseball",
    label: "MLB",
    logo: "https://a.espncdn.com/i/teamlogos/leagues/500/mlb.png",
  },
  {
    slug: "nhl",
    sport: "hockey",
    label: "NHL",
    logo: "https://a.espncdn.com/i/teamlogos/leagues/500/nhl.png",
  },
  {
    slug: "wnba",
    sport: "basketball",
    label: "WNBA",
    logo: "https://a.espncdn.com/i/teamlogos/leagues/500/wnba.png",
  },
  {
    slug: "mens-college-basketball",
    sport: "basketball",
    label: "NCAAM",
    logo: "https://a.espncdn.com/redesign/assets/img/icons/ESPN-icon-basketball.png",
  },
  {
    slug: "womens-college-basketball",
    sport: "basketball",
    label: "NCAAW",
    logo: "https://a.espncdn.com/redesign/assets/img/icons/ESPN-icon-basketball.png",
  },
  {
    slug: "college-football",
    sport: "football",
    label: "NCAAF",
    logo: "https://a.espncdn.com/redesign/assets/img/icons/ESPN-icon-football-college.png",
  },
  {
    slug: "usa.1",
    sport: "soccer",
    label: "MLS",
    logo: "https://a.espncdn.com/i/leaguelogos/soccer/500/19.png",
  },
  {
    slug: "eng.1",
    sport: "soccer",
    label: "PREMIER LEAGUE",
    logo: "https://a.espncdn.com/i/leaguelogos/soccer/500/23.png",
  },
  {
    slug: "uefa.champions",
    sport: "soccer",
    label: "UCL",
    logo: "https://a.espncdn.com/i/leaguelogos/soccer/500/2.png",
  },
] as const;

export type EspnLeagueSlug = (typeof espnLeagues)[number]["slug"];

export function getEspnLeague(slug: string | undefined) {
  return espnLeagues.find((league) => league.slug === slug) ?? espnLeagues[0];
}

/**
 * Strict lookup — returns undefined instead of falling back to the first
 * league. The web pages want the lenient version (an unknown ?league= just
 * shows the NBA board), but the API must 404 rather than silently return
 * data for a league the caller didn't ask for.
 */
export function findEspnLeague(slug: string | undefined) {
  return espnLeagues.find((league) => league.slug === slug);
}

type ScoreboardResponse = {
  events?: Array<{
    id?: string;
    date?: string;
    name?: string;
    competitions?: Array<{
      venue?: { fullName?: string };
      broadcasts?: Array<{ names?: string[] }>;
      status?: {
        type?: { state?: string; shortDetail?: string; description?: string };
      };
      competitors?: Array<{
        homeAway?: string;
        score?: string;
        records?: Array<{ summary?: string }>;
        team?: {
          displayName?: string;
          shortDisplayName?: string;
          abbreviation?: string;
          logo?: string;
        };
      }>;
      headlines?: Array<{ shortLinkText?: string; description?: string }>;
    }>;
  }>;
};

export async function getEspnScoreboard(
  slug: string,
  { revalidate = 30 }: { revalidate?: number } = {},
): Promise<EspnGame[]> {
  const league = getEspnLeague(slug);
  const url = `https://site.api.espn.com/apis/site/v2/sports/${league.sport}/${league.slug}/scoreboard`;

  try {
    const response = await fetch(url, {
      next: { revalidate },
      headers: { accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`ESPN responded ${response.status}`);
    }

    const data = (await response.json()) as ScoreboardResponse;

    return (data.events ?? []).map((event) => {
      const competition = event.competitions?.[0];
      const state = competition?.status?.type?.state;

      return {
        id: String(event.id ?? ""),
        league: league.label,
        leagueSlug: league.slug,
        date: event.date ?? "",
        status: competition?.status?.type?.shortDetail ?? "",
        statusState: state === "in" ? "in" : state === "post" ? "post" : "pre",
        detail: event.name ?? "",
        venue: competition?.venue?.fullName ?? null,
        broadcast: competition?.broadcasts?.[0]?.names?.[0] ?? null,
        headline:
          competition?.headlines?.[0]?.shortLinkText ??
          competition?.headlines?.[0]?.description ??
          null,
        teams: (competition?.competitors ?? []).map((competitor) => ({
          name:
            competitor.team?.displayName ??
            competitor.team?.shortDisplayName ??
            "TBD",
          abbreviation: competitor.team?.abbreviation ?? "",
          logo: competitor.team?.logo ?? null,
          score: competitor.score ?? null,
          record: competitor.records?.[0]?.summary ?? null,
          isHome: competitor.homeAway === "home",
        })),
      };
    });
  } catch (error) {
    console.warn(`Unable to read ESPN ${league.slug} scoreboard.`, error);
    return [];
  }
}

export type EspnOdds = {
  provider: string;
  details: string | null;
  overUnder: number | null;
  spread: number | null;
  homeMoneyLine: number | null;
  awayMoneyLine: number | null;
  favorite: "home" | "away" | null;
};

export type EspnLeaderLine = {
  team: string;
  category: string;
  athlete: string;
  headshot: string | null;
  position: string | null;
  value: string;
};

export type EspnInjury = {
  team: string;
  athlete: string;
  position: string | null;
  status: string;
  detail: string | null;
};

export type EspnGameSummary = {
  id: string;
  league: string;
  leagueSlug: string;
  date: string;
  status: string;
  statusState: "pre" | "in" | "post";
  teams: EspnTeam[];
  venue: {
    name: string;
    city: string | null;
    state: string | null;
    image: string | null;
    indoor: boolean | null;
  } | null;
  broadcasts: string[];
  odds: EspnOdds[];
  tickets: { name: string; link: string }[];
  leaders: EspnLeaderLine[];
  injuries: EspnInjury[];
  lastFive: { team: string; games: string[] }[];
  neutralSite: boolean;
};

type SummaryResponse = {
  header?: {
    competitions?: Array<{
      date?: string;
      neutralSite?: boolean;
      status?: { type?: { state?: string; detail?: string; shortDetail?: string } };
      broadcasts?: Array<{ media?: { shortName?: string } }>;
      competitors?: Array<{
        homeAway?: string;
        score?: string;
        record?: Array<{ displayValue?: string }>;
        team?: {
          displayName?: string;
          abbreviation?: string;
          logo?: string;
          logos?: Array<{ href?: string }>;
        };
      }>;
    }>;
  };
  gameInfo?: {
    venue?: {
      fullName?: string;
      indoor?: boolean;
      address?: { city?: string; state?: string };
      images?: Array<{ href?: string }>;
    };
  };
  odds?: Array<{
    provider?: { name?: string };
    details?: string;
    overUnder?: number;
    spread?: number;
    homeTeamOdds?: { favorite?: boolean; moneyLine?: number };
    awayTeamOdds?: { favorite?: boolean; moneyLine?: number };
  }>;
  ticketsInfo?: { tickets?: Array<{ ticketName?: string; ticketLink?: string }> };
  leaders?: Array<{
    team?: { displayName?: string };
    leaders?: Array<{
      displayName?: string;
      leaders?: Array<{
        displayValue?: string;
        athlete?: {
          displayName?: string;
          position?: { abbreviation?: string };
          headshot?: { href?: string };
        };
      }>;
    }>;
  }>;
  injuries?: Array<{
    team?: { displayName?: string };
    injuries?: Array<{
      status?: string;
      details?: { type?: string };
      athlete?: { displayName?: string; position?: { abbreviation?: string } };
    }>;
  }>;
  lastFiveGames?: Array<{
    team?: { displayName?: string };
    events?: Array<{ gameResult?: string; score?: string }>;
  }>;
};

export async function getEspnGameSummary(
  slug: string,
  eventId: string,
  { revalidate = 120 }: { revalidate?: number } = {},
): Promise<EspnGameSummary | null> {
  const league = getEspnLeague(slug);
  const url = `https://site.api.espn.com/apis/site/v2/sports/${league.sport}/${league.slug}/summary?event=${encodeURIComponent(eventId)}`;

  try {
    const response = await fetch(url, {
      next: { revalidate },
      headers: { accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`ESPN responded ${response.status}`);
    }

    const data = (await response.json()) as SummaryResponse;
    const competition = data.header?.competitions?.[0];

    if (!competition) {
      return null;
    }

    const state = competition.status?.type?.state;
    const venue = data.gameInfo?.venue;

    return {
      id: eventId,
      league: league.label,
      leagueSlug: league.slug,
      date: competition.date ?? "",
      status:
        competition.status?.type?.detail ??
        competition.status?.type?.shortDetail ??
        "",
      statusState: state === "in" ? "in" : state === "post" ? "post" : "pre",
      neutralSite: Boolean(competition.neutralSite),
      teams: (competition.competitors ?? []).map((competitor) => ({
        name: competitor.team?.displayName ?? "TBD",
        abbreviation: competitor.team?.abbreviation ?? "",
        logo: competitor.team?.logo ?? competitor.team?.logos?.[0]?.href ?? null,
        score: competitor.score ?? null,
        record: competitor.record?.[0]?.displayValue ?? null,
        isHome: competitor.homeAway === "home",
      })),
      venue: venue?.fullName
        ? {
            name: venue.fullName,
            city: venue.address?.city ?? null,
            state: venue.address?.state ?? null,
            image: venue.images?.[0]?.href ?? null,
            // ESPN omits `indoor` for indoor-only sports, so undefined must not
            // collapse into "outdoor".
            indoor: typeof venue.indoor === "boolean" ? venue.indoor : null,
          }
        : null,
      broadcasts: (competition.broadcasts ?? [])
        .map((broadcast) => broadcast.media?.shortName)
        .filter((name): name is string => Boolean(name)),
      odds: (data.odds ?? []).map((entry) => ({
        provider: entry.provider?.name ?? "Line",
        details: entry.details ?? null,
        overUnder: entry.overUnder ?? null,
        spread: entry.spread ?? null,
        homeMoneyLine: entry.homeTeamOdds?.moneyLine ?? null,
        awayMoneyLine: entry.awayTeamOdds?.moneyLine ?? null,
        favorite: entry.homeTeamOdds?.favorite
          ? "home"
          : entry.awayTeamOdds?.favorite
            ? "away"
            : null,
      })),
      tickets: (data.ticketsInfo?.tickets ?? [])
        .filter((ticket) => ticket.ticketName && ticket.ticketLink)
        .map((ticket) => ({
          name: ticket.ticketName as string,
          link: ticket.ticketLink as string,
        }))
        .slice(0, 3),
      leaders: (data.leaders ?? []).flatMap((teamLeaders) =>
        (teamLeaders.leaders ?? []).flatMap((category) =>
          (category.leaders ?? []).slice(0, 1).map((leader) => ({
            team: teamLeaders.team?.displayName ?? "",
            category: category.displayName ?? "",
            athlete: leader.athlete?.displayName ?? "",
            headshot: leader.athlete?.headshot?.href ?? null,
            position: leader.athlete?.position?.abbreviation ?? null,
            value: leader.displayValue ?? "",
          })),
        ),
      ),
      injuries: (data.injuries ?? []).flatMap((teamInjuries) =>
        (teamInjuries.injuries ?? []).slice(0, 6).map((injury) => ({
          team: teamInjuries.team?.displayName ?? "",
          athlete: injury.athlete?.displayName ?? "",
          position: injury.athlete?.position?.abbreviation ?? null,
          status: injury.status ?? "Unknown",
          detail: injury.details?.type ?? null,
        })),
      ),
      lastFive: (data.lastFiveGames ?? []).map((entry) => ({
        team: entry.team?.displayName ?? "",
        games: (entry.events ?? [])
          .slice(0, 5)
          .map((event) => event.gameResult ?? "-"),
      })),
    };
  } catch (error) {
    console.warn(`Unable to read ESPN game ${eventId}.`, error);
    return null;
  }
}
