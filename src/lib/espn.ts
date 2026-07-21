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

export const espnLeagues = [
  { slug: "nba", sport: "basketball", label: "NBA" },
  { slug: "nfl", sport: "football", label: "NFL" },
  { slug: "mens-college-basketball", sport: "basketball", label: "NCAAM" },
  { slug: "wnba", sport: "basketball", label: "WNBA" },
] as const;

export type EspnLeagueSlug = (typeof espnLeagues)[number]["slug"];

export function getEspnLeague(slug: string | undefined) {
  return espnLeagues.find((league) => league.slug === slug) ?? espnLeagues[0];
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
  { revalidate = 300 }: { revalidate?: number } = {},
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
