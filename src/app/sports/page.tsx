import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { espnLeagues, getEspnLeague, getEspnScoreboard } from "@/lib/espn";
import {
  getReleasesOnDate,
  getSignatureAthletesForTeams,
  getSignatureReleases,
} from "@/lib/sportsSneakers";
import {
  buildMetadata,
  formatReleaseDate,
  getBrandName,
  getReleaseImage,
  getReleaseUrl,
} from "@/lib/siteData";

type SportsPageProps = {
  searchParams: Promise<{ league?: string }>;
};

export async function generateMetadata({
  searchParams,
}: SportsPageProps): Promise<Metadata> {
  const { league } = await searchParams;
  const active = getEspnLeague(league);

  return buildMetadata({
    title: `${active.label} Scores, Schedule & Sneakers`,
    description:
      "Live scores and schedules paired with the signature sneakers on court and the drops landing on game day.",
    path: `/sports?league=${active.slug}`,
  });
}

export const dynamic = "force-dynamic";

export default async function SportsPage({ searchParams }: SportsPageProps) {
  const { league } = await searchParams;
  const active = getEspnLeague(league);
  const games = await getEspnScoreboard(active.slug);

  const teamAbbreviations = games.flatMap((game) =>
    game.teams.map((team) => team.abbreviation),
  );
  const athletes = getSignatureAthletesForTeams(teamAbbreviations, active.slug);

  const [signatures, gameDayDrops] = await Promise.all([
    getSignatureReleases(athletes),
    getReleasesOnDate(new Date()),
  ]);

  return (
    <main className="editorial-home sports-page">
      <header className="ed-masthead">
        <p className="ed-cat">Sports</p>
        <h1>What&apos;s on the court, and what&apos;s on their feet.</h1>
        <p className="ed-deck">
          Live scores and schedules from ESPN, matched to the signature lines
          playing tonight and the sneakers dropping the same day.
        </p>
      </header>

      <nav className="sports-leagues" aria-label="Choose league">
        {espnLeagues.map((option) => (
          <Link
            aria-current={option.slug === active.slug ? "page" : undefined}
            href={`/sports?league=${option.slug}`}
            key={option.slug}
          >
            {option.label}
          </Link>
        ))}
      </nav>

      <div className="ed-body sports-body">
        <section className="ed-column" aria-labelledby="scoreboard-title">
          <h2 className="ed-column__title" id="scoreboard-title">
            {active.label} scoreboard
          </h2>

          {games.length ? (
            <ol className="score-list">
              {games.map((game) => (
                <li key={game.id}>
                  <Link
                    className="score-card"
                    href={`/sports/${game.leagueSlug}/${game.id}`}
                  >
                  <div className="score-card__head">
                    <span className={`score-status score-status--${game.statusState}`}>
                      {game.statusState === "in" ? "Live" : game.status}
                    </span>
                    {game.broadcast ? <span>{game.broadcast}</span> : null}
                  </div>

                  <div className="score-card__teams">
                    {game.teams.map((team) => (
                      <div className="score-team" key={`${game.id}-${team.abbreviation}`}>
                        {team.logo ? (
                          // ESPN team logos come from a CDN outside next/image config.
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={team.logo} alt="" width={30} height={30} loading="lazy" />
                        ) : (
                          <span className="score-team__badge">{team.abbreviation}</span>
                        )}
                        <div>
                          <strong>{team.name}</strong>
                          {team.record ? <em>{team.record}</em> : null}
                        </div>
                        <span className="score-team__score">{team.score ?? "--"}</span>
                      </div>
                    ))}
                  </div>

                  <p className="score-card__venue">
                    {game.venue ? `${game.venue} · ` : ""}
                    <span>Game details, odds &amp; sneakers</span>
                  </p>
                  </Link>
                </li>
              ))}
            </ol>
          ) : (
            <p className="ed-deck">
              No {active.label} games on the board right now. Check another
              league or come back on game day.
            </p>
          )}
        </section>

        <aside className="ed-rail" aria-label="Sneaker tie-ins">
          <div className="ed-rail__inner">
            <section className="ed-module">
              <h2>On their feet tonight</h2>
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
                  No signature lines matched tonight&apos;s teams in the archive.
                </p>
              )}
            </section>

            <section className="ed-module">
              <h2>Dropping on game day</h2>
              {gameDayDrops.length ? (
                <ul className="ed-calendar">
                  {gameDayDrops.map((release) => (
                    <li key={release.product_id}>
                      <time>{formatReleaseDate(release)}</time>
                      <Link href={getReleaseUrl(release)}>{release.name}</Link>
                      <span>
                        {getBrandName(release)} · ${release.price}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="sports-empty">
                  Nothing releases today. The calendar has what&apos;s next.
                </p>
              )}
              <Link className="ed-more" href="/calendar">
                Open the calendar
              </Link>
            </section>
          </div>
        </aside>
      </div>
    </main>
  );
}
