import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getEspnGameSummary, getEspnLeague } from "@/lib/espn";
import {
  getReleasesOnDate,
  getSignatureAthletesForTeams,
  getSignatureReleases,
} from "@/lib/sportsSneakers";
import {
  buildMetadata,
  formatReleaseDate,
  getReleaseImage,
  getReleaseUrl,
} from "@/lib/siteData";

type GamePageProps = {
  params: Promise<{ league: string; gameId: string }>;
};

export async function generateMetadata({ params }: GamePageProps): Promise<Metadata> {
  const { league, gameId } = await params;
  const game = await getEspnGameSummary(league, gameId);

  if (!game) {
    return {};
  }

  const matchup = game.teams.map((team) => team.name).join(" vs ");

  return buildMetadata({
    title: `${matchup} — Odds, Venue & Sneakers`,
    description: `${matchup}: ${game.status}${
      game.venue ? ` at ${game.venue.name}` : ""
    }. Betting lines, team leaders, injuries, and the sneakers tied to the matchup.`,
    path: `/sports/${game.leagueSlug}/${game.id}`,
  });
}

export const dynamic = "force-dynamic";

export default async function GamePage({ params }: GamePageProps) {
  const { league, gameId } = await params;
  const game = await getEspnGameSummary(league, gameId);

  if (!game) {
    notFound();
  }

  const leagueMeta = getEspnLeague(game.leagueSlug);
  const athletes = getSignatureAthletesForTeams(
    game.teams.map((team) => team.abbreviation),
    game.leagueSlug,
  );
  const gameDate = game.date ? new Date(game.date) : new Date();
  const [signatures, gameDayDrops] = await Promise.all([
    getSignatureReleases(athletes, 2),
    getReleasesOnDate(gameDate, 6),
  ]);

  const away = game.teams.find((team) => !team.isHome) ?? game.teams[0];
  const home = game.teams.find((team) => team.isHome) ?? game.teams[1];

  return (
    <main className="editorial-home game-page">
      <header className="ed-masthead">
        <p className="ed-cat">
          <Link href={`/sports?league=${game.leagueSlug}`}>{leagueMeta.label}</Link>
        </p>
        <h1>
          {away?.name} at {home?.name}
        </h1>
        <p className="ed-deck">
          {game.status}
          {game.venue ? ` · ${game.venue.name}` : ""}
          {game.neutralSite ? " · Neutral site" : ""}
        </p>
      </header>

      <section className="game-hero">
        <div className="game-score">
          {game.teams.map((team) => (
            <div className="game-score__team" key={team.abbreviation}>
              {team.logo ? (
                // ESPN team logos come from a CDN outside next/image config.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={team.logo} alt="" width={52} height={52} />
              ) : null}
              <div>
                <strong>{team.name}</strong>
                <span>
                  {team.isHome ? "Home" : "Away"}
                  {team.record ? ` · ${team.record}` : ""}
                </span>
              </div>
              {game.statusState === "pre" ? null : <em>{team.score ?? "--"}</em>}
            </div>
          ))}
        </div>

        {game.venue?.image ? (
          <div className="game-venue-media">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={game.venue.image} alt={game.venue.name} loading="lazy" />
          </div>
        ) : null}
      </section>

      <div className="ed-body game-body">
        <section className="ed-column">
          <h2 className="ed-column__title">Betting odds</h2>
          {game.odds.length ? (
            <div className="odds-list">
              {game.odds.map((line) => (
                <article className="odds-card" key={line.provider}>
                  <p className="ed-cat">{line.provider}</p>
                  <dl>
                    <div>
                      <dt>Line</dt>
                      <dd>{line.details ?? "--"}</dd>
                    </div>
                    <div>
                      <dt>Over / Under</dt>
                      <dd>{line.overUnder ?? "--"}</dd>
                    </div>
                    <div>
                      <dt>{away?.abbreviation || "Away"} moneyline</dt>
                      <dd>{formatMoneyLine(line.awayMoneyLine)}</dd>
                    </div>
                    <div>
                      <dt>{home?.abbreviation || "Home"} moneyline</dt>
                      <dd>{formatMoneyLine(line.homeMoneyLine)}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          ) : (
            <p className="sports-empty">
              No betting lines posted for this game yet. Odds appear here once
              sportsbooks publish them, usually closer to tip-off.
            </p>
          )}

          {game.leaders.length ? (
            <>
              <h2 className="ed-column__title game-section">Team leaders</h2>
              <ul className="leader-list">
                {game.leaders.map((leader) => (
                  <li key={`${leader.team}-${leader.category}-${leader.athlete}`}>
                    {leader.headshot ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={leader.headshot} alt="" width={44} height={44} loading="lazy" />
                    ) : (
                      <span className="leader-avatar" aria-hidden="true" />
                    )}
                    <div>
                      <strong>{leader.athlete}</strong>
                      <span>
                        {leader.team}
                        {leader.position ? ` · ${leader.position}` : ""}
                      </span>
                    </div>
                    <div className="leader-stat">
                      <em>{leader.value}</em>
                      <span>{leader.category}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          {game.injuries.length ? (
            <>
              <h2 className="ed-column__title game-section">Injury report</h2>
              <ul className="injury-list">
                {game.injuries.map((injury) => (
                  <li key={`${injury.team}-${injury.athlete}`}>
                    <div>
                      <strong>{injury.athlete}</strong>
                      <span>
                        {injury.team}
                        {injury.position ? ` · ${injury.position}` : ""}
                      </span>
                    </div>
                    <span className="injury-status">
                      {injury.status}
                      {injury.detail ? ` · ${injury.detail}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </section>

        <aside className="ed-rail">
          <div className="ed-rail__inner">
            <section className="ed-module">
              <h2>Game info</h2>
              <dl className="game-info">
                <div>
                  <dt>Tip-off</dt>
                  <dd>{formatKickoff(game.date) || game.status}</dd>
                </div>
                {game.venue ? (
                  <>
                    <div>
                      <dt>Venue</dt>
                      <dd>{game.venue.name}</dd>
                    </div>
                    {game.venue.city ? (
                      <div>
                        <dt>Location</dt>
                        <dd>
                          {game.venue.city}
                          {game.venue.state ? `, ${game.venue.state}` : ""}
                        </dd>
                      </div>
                    ) : null}
                    {game.venue.indoor !== null ? (
                      <div>
                        <dt>Surface</dt>
                        <dd>{game.venue.indoor ? "Indoor" : "Outdoor"}</dd>
                      </div>
                    ) : null}
                  </>
                ) : null}
                {game.broadcasts.length ? (
                  <div>
                    <dt>Watch</dt>
                    <dd>{game.broadcasts.join(", ")}</dd>
                  </div>
                ) : null}
              </dl>

              {game.tickets.length ? (
                <div className="game-tickets">
                  {game.tickets.map((ticket) => (
                    <a href={ticket.link} key={ticket.link} rel="nofollow noopener">
                      {ticket.name}
                    </a>
                  ))}
                </div>
              ) : null}
            </section>

            {game.lastFive.length ? (
              <section className="ed-module">
                <h2>Last five</h2>
                <ul className="lastfive-list">
                  {game.lastFive.map((entry) => (
                    <li key={entry.team}>
                      <strong>{entry.team}</strong>
                      <span>
                        {entry.games.map((result, index) => (
                          <em
                            className={`lastfive-chip lastfive-chip--${result.toLowerCase()}`}
                            key={`${entry.team}-${index}`}
                          >
                            {result}
                          </em>
                        ))}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section className="ed-module">
              <h2>On their feet</h2>
              {signatures.length ? (
                <div className="sig-list">
                  {signatures.map((signature) => (
                    <article key={signature.athlete}>
                      <p className="ed-cat">{signature.athlete}</p>
                      <ul>
                        {signature.releases.map((release) => (
                          <li key={release.product_id}>
                            <Link href={getReleaseUrl(release)} className="sig-media">
                              <Image
                                src={getReleaseImage(release)}
                                alt=""
                                width={120}
                                height={120}
                                sizes="70px"
                              />
                            </Link>
                            <div>
                              <Link href={getReleaseUrl(release)}>{release.name}</Link>
                              <span>{formatReleaseDate(release)}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="sports-empty">
                  No signature lines in the archive matched these rosters.
                </p>
              )}
            </section>

            {gameDayDrops.length ? (
              <section className="ed-module">
                <h2>Dropping game day</h2>
                <ul className="ed-calendar">
                  {gameDayDrops.map((release) => (
                    <li key={release.product_id}>
                      <time>{formatReleaseDate(release)}</time>
                      <Link href={getReleaseUrl(release)}>{release.name}</Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        </aside>
      </div>
    </main>
  );
}

function formatMoneyLine(value: number | null) {
  if (value === null) {
    return "--";
  }

  return value > 0 ? `+${value}` : String(value);
}

function formatKickoff(date: string) {
  if (!date) {
    return "";
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(parsed);
}
