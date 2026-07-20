import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CountdownModule } from "@/components/CountdownModule";
import { CopDropButtons } from "@/components/CopDropButtons";
import { HeroSearch } from "@/components/HeroSearch";
import { ReleaseCard } from "@/components/ReleaseCard";
import type { LegacyRelease } from "@/lib/legacyMobileApi";
import { getDbSneakerReleasesRecentlyAdded } from "@/lib/dbReleases";
import {
  appStoreUrl,
  brandReleasePages,
  buildMetadata,
  cleanHtmlContent,
  formatReleaseDate,
  getAbsoluteReleaseUrl,
  getBrandName,
  getReleaseImage,
  getReleaseUrl,
  googlePlayUrl,
  siteName,
  siteUrl,
} from "@/lib/siteData";

export const metadata: Metadata = buildMetadata({
  title: "Sneaker Release Dates",
  description:
    "Search sneaker release dates, browse the newest SoleInsider drops, compare COP/DROP signals, and explore the deepest sneaker release calendar archive.",
  path: "/",
});

export const dynamic = "force-dynamic";

export default async function Home() {
  const dbReleases = await getDbSneakerReleasesRecentlyAdded(48);
  const releases = sortRecentlyAdded(dbReleases);
  const heroRelease = getHeroRelease(releases);

  if (!heroRelease) {
    return (
      <main className="front-page">
        <section className="homepage-empty">
          <p className="kicker">Sneaker release dates</p>
          <h1>SoleInsider release archive</h1>
          <p>
            Release data is temporarily unavailable. Search, calendar, and app
            links remain available from the main navigation.
          </p>
        </section>
      </main>
    );
  }

  const featuredRelease = getFeaturedRelease(releases, [heroRelease.product_id]);
  const shownFeatureIds = [heroRelease.product_id, featuredRelease?.product_id].filter(Boolean);
  const newestHero = releases[0];
  const newestStandard = releases
    .filter((release) => release.product_id !== newestHero?.product_id)
    .slice(0, 9);
  const newestReleases = [newestHero, ...newestStandard].filter(
    (release): release is LegacyRelease => Boolean(release),
  );
  const calendarPreview = getCalendarPreview(releases, heroRelease);
  const trendingReleases = getTrendingReleases(releases, shownFeatureIds);
  const archiveReleases = getArchiveReleases(releases, heroRelease);
  const seoLinks = brandReleasePages.slice(0, 4);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: siteName,
        url: siteUrl,
        potentialAction: {
          "@type": "SearchAction",
          target: `${siteUrl}/mobileapi/search?search={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "ItemList",
        name: "Newest SoleInsider sneaker releases",
        itemListElement: newestReleases.map((release, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: getAbsoluteReleaseUrl(release),
          name: release.name,
        })),
      },
    ],
  };

  return (
    <main className="front-page homepage-redesign">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="home-search-hero" aria-labelledby="home-search-title">
        <div className="home-search-hero__copy">
          <p className="kicker">Sneaker release archive</p>
          <h1 id="home-search-title">
            Search drops, track dates, and open the next release first.
          </h1>
          <p>
            SoleInsider keeps sneaker collectors close to release dates, retail
            prices, SKU codes, COP/DROP signals, and a deep archive of Nike,
            Jordan, adidas, Yeezy, and New Balance launches.
          </p>
          <HeroSearch />
        </div>

        <article className="home-search-hero__feature">
          <Link href={getReleaseUrl(heroRelease)} className="home-feature-image">
            <Image
              src={getReleaseImage(heroRelease)}
              alt={`${heroRelease.name} release`}
              fill
              sizes="(max-width: 980px) 100vw, 48vw"
              priority
            />
            <span className="drop-badge">Top Drop</span>
          </Link>
          <div className="home-search-hero__meta">
            <p>{getBrandName(heroRelease)} / {formatReleaseDate(heroRelease)}</p>
            <h2>
              <Link href={getReleaseUrl(heroRelease)}>
                {heroRelease.name}
              </Link>
            </h2>
            <span>{formatRetailPrice(heroRelease.price)} retail</span>
          </div>
        </article>
      </section>

      <section className="content-band newest-release-feed" id="upcoming-releases">
        <div className="section-heading">
          <div>
            <p className="kicker">Newest releases</p>
            <h2>Freshly added to the release desk.</h2>
          </div>
          <p>
            The latest products added to SoleInsider, built for fast scanning
            from Google, direct visits, and collectors checking what just hit
            the archive.
          </p>
        </div>
        <div className="release-grid">
          {newestHero ? (
            <ReleaseCard release={newestHero} key={newestHero.id} priority featured />
          ) : null}
          {newestStandard.slice(0, 5).map((release, index) => (
            <ReleaseCard release={release} key={release.id} priority={index < 2} />
          ))}
          <div className="release-alert-band">
            <p>Track any release. Get an alert when it drops.</p>
            <Link href={appStoreUrl}>Set alert</Link>
          </div>
          {newestStandard.slice(5, 9).map((release) => (
            <ReleaseCard release={release} key={release.id} />
          ))}
          <div className="release-grid__action">
            <Link href="/calendar">View all releases</Link>
          </div>
        </div>
      </section>

      {featuredRelease ? (
      <section className="featured-release-panel" aria-labelledby="featured-release-title">
        <div className="featured-release-panel__media">
          <Image
            src={getReleaseImage(featuredRelease)}
            alt={`${featuredRelease.name} sneaker`}
            fill
            sizes="(max-width: 980px) 100vw, 46vw"
          />
        </div>
        <div className="featured-release-panel__content">
          <p className="kicker">Featured release</p>
          <h2 id="featured-release-title">
            <Link href={getReleaseUrl(featuredRelease)}>
              {featuredRelease.name}
            </Link>
          </h2>
          <p>
            {cleanHtmlContent(featuredRelease.content) ||
              `${featuredRelease.name} is listed for ${formatReleaseDate(
                featuredRelease,
              )} with SKU ${featuredRelease.sku || "TBA"}.`}
          </p>
          <dl className="homepage-facts">
            <div>
              <dt>Release date</dt>
              <dd>{formatReleaseDate(featuredRelease)}</dd>
            </div>
            <div>
              <dt>Retail</dt>
              <dd>{formatRetailPrice(featuredRelease.price)}</dd>
            </div>
            <div>
              <dt>SKU</dt>
              <dd>{featuredRelease.sku || "TBA"}</dd>
            </div>
          </dl>
          <CountdownModule releaseDateCalendar={featuredRelease.release_date_calendar} />
          <CopDropButtons release={featuredRelease} />
          <Link className="homepage-primary-link" href={getReleaseUrl(featuredRelease)}>
            View full release
          </Link>
        </div>
      </section>
      ) : null}

      <section className="calendar-preview" aria-labelledby="calendar-preview-title">
        <div>
          <p className="kicker">Release calendar preview</p>
          <h2 id="calendar-preview-title">Plan the next drops by date.</h2>
          <p>
            A cleaner calendar path for release planning, retail checks, and
            quick jumps into product detail pages.
          </p>
          <Link className="homepage-primary-link" href="/calendar">
            Open calendar
          </Link>
        </div>
        <ol>
          {calendarPreview.map((release, index) => (
            <li key={release.id}>
              {shouldShowMonthDivider(calendarPreview, index) ? (
                <span className="calendar-preview__month">{getMonthLabel(release)}</span>
              ) : null}
              <Image
                src={getReleaseImage(release)}
                alt=""
                width={48}
                height={48}
              />
              <time>{formatReleaseDate(release)}</time>
              <Link href={getReleaseUrl(release)}>{release.name}</Link>
              <span>{getBrandName(release)} / {formatRetailPrice(release.price)}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="trending-votes" aria-labelledby="trending-votes-title">
        <div className="section-heading">
          <div>
            <p className="kicker">Trending / Most voted</p>
            <h2 id="trending-votes-title">The releases collectors are calling.</h2>
          </div>
          <p>
            COP/DROP voting turns release browsing into a quick demand signal
            before visitors open a detail page.
          </p>
        </div>
        <div className="trending-votes__grid">
          {trendingReleases.map((release, index) => (
            <article key={release.id}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <Link href={getReleaseUrl(release)} className="trending-votes__image">
                <Image
                  src={getReleaseImage(release)}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, 25vw"
                />
              </Link>
              <p>{getBrandName(release)}</p>
              <h3>
                <Link href={getReleaseUrl(release)}>{release.name}</Link>
              </h3>
              <strong>{getTrendingSignal(release)}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="archive-day" aria-labelledby="archive-day-title">
        <div>
          <p className="kicker">Archive & On This Day</p>
          <h2 id="archive-day-title">A deeper record than the next raffle.</h2>
          <p>
            Explore current launches alongside historical SoleInsider release
            data, date-based discovery, and brand archives that keep old sneaker
            searches useful.
          </p>
          <div className="archive-day__links">
            <Link href="/sneaker-history">Sneaker history</Link>
            <Link href="/on-this-day">On this day</Link>
          </div>
        </div>
        <div className="archive-day__list">
          {archiveReleases.map((release) => (
            <article key={release.id}>
              <time>{formatReleaseDate(release)}</time>
              <h3>
                <Link href={getReleaseUrl(release)}>{release.name}</Link>
              </h3>
              <p>SKU {release.sku || "TBA"} / {getBrandName(release)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="app-download-cta" aria-labelledby="app-download-title">
        <div>
          <p className="kicker">Mobile app</p>
          <h2 id="app-download-title">Release reminders when timing matters.</h2>
          <p>
            Get the SoleInsider app for alerts, tracking, comments, and COP/DROP
            voting while the web stays focused on search and product details.
          </p>
        </div>
        <div className="app-download-cta__actions">
          <a href={appStoreUrl}>Download on App Store</a>
          <a href={googlePlayUrl}>Get it on Google Play</a>
        </div>
      </section>

      <section className="homepage-seo-block" aria-labelledby="homepage-seo-title">
        <p className="kicker">Sneaker release dates</p>
        <h2 id="homepage-seo-title">SoleInsider tracks release dates, SKUs, prices, and archives.</h2>
        <p>
          Use SoleInsider to search upcoming and past sneaker releases, compare
          retail prices, check SKU data, browse a clean sneaker release calendar,
          and open product detail pages for Air Jordan, Nike, adidas, Yeezy, New
          Balance, ASICS, and more.
        </p>
        <nav aria-label="Popular release pages">
          <Link href="/calendar">Release calendar</Link>
          {seoLinks.map((page) => (
            <Link href={`/${page.slug}`} key={page.slug}>
              {page.label} releases
            </Link>
          ))}
        </nav>
      </section>
    </main>
  );
}

function sortRecentlyAdded(releases: LegacyRelease[]) {
  return releases
    .slice()
    .sort(
      (a, b) =>
        getCreatedTimestamp(b) - getCreatedTimestamp(a) ||
        Number(b.product_id) - Number(a.product_id),
    );
}

function getHeroRelease(releases: LegacyRelease[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    releases
      .filter((release) => getReleaseTimestamp(release) >= today.getTime())
      .sort((a, b) => getReleaseTimestamp(a) - getReleaseTimestamp(b))[0] ?? releases[0]
  );
}

function getFeaturedRelease(releases: LegacyRelease[], excludeIds: string[]) {
  return releases
    .filter((release) => !excludeIds.includes(release.product_id))
    .slice()
    .sort(
      (a, b) =>
        getTotalVotes(b) - getTotalVotes(a) ||
        Number(b.yes_votes) - Number(a.yes_votes) ||
        getCreatedTimestamp(b) - getCreatedTimestamp(a),
    )[0];
}

function getCalendarPreview(releases: LegacyRelease[], fallback: LegacyRelease) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcoming = releases
    .filter((release) => getReleaseTimestamp(release) >= today.getTime())
    .sort((a, b) => getReleaseTimestamp(a) - getReleaseTimestamp(b))
    .slice(0, 6);

  return upcoming.length ? upcoming : releases.slice(0, 6).concat(fallback).slice(0, 6);
}

function getTrendingReleases(releases: LegacyRelease[], excludeIds: string[]) {
  return releases
    .filter((release) => !excludeIds.includes(release.product_id))
    .slice()
    .sort((a, b) => getTotalVotes(b) - getTotalVotes(a))
    .slice(0, 4);
}

function getArchiveReleases(releases: LegacyRelease[], fallback: LegacyRelease) {
  const today = new Date();
  const monthDay = `${today.getMonth() + 1}-${today.getDate()}`;
  const sameDay = releases
    .filter((release) => getReleaseMonthDay(release) === monthDay)
    .slice(0, 3);

  if (sameDay.length) return sameDay;

  const oldest = releases
    .slice()
    .sort((a, b) => getReleaseTimestamp(a) - getReleaseTimestamp(b))
    .slice(0, 3);

  return oldest.length ? oldest : [fallback];
}

function getCreatedTimestamp(release: LegacyRelease) {
  const timestamp = Date.parse(release.created_at.replace(" ", "T"));

  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getReleaseTimestamp(release: LegacyRelease) {
  const match = release.release_date_calendar.match(/^(\d{4}),(\d{1,2}),(\d{1,2})/);

  if (!match) return 0;

  const [, year, month, day] = match.map(Number);

  return new Date(year, month - 1, day).getTime();
}

function getReleaseMonthDay(release: LegacyRelease) {
  const match = release.release_date_calendar.match(/^(\d{4}),(\d{1,2}),(\d{1,2})/);

  if (!match) return "";

  const [, , month, day] = match.map(Number);

  return `${month}-${day}`;
}

function formatRetailPrice(price: string) {
  const numericPrice = Number(price);

  if (!Number.isFinite(numericPrice) || numericPrice <= 0) return "TBA";

  return `$${numericPrice.toLocaleString()}`;
}

function getTotalVotes(release: LegacyRelease) {
  return Number(release.yes_votes) + Number(release.no_votes);
}

function getTrendingSignal(release: LegacyRelease) {
  const votes = Number(release.yes_votes);

  if (votes < 25) {
    return "Trending";
  }

  return `${votes.toLocaleString()} COP ${votes === 1 ? "vote" : "votes"}`;
}

function shouldShowMonthDivider(releases: LegacyRelease[], index: number) {
  if (index === 0) return true;

  return getMonthLabel(releases[index]) !== getMonthLabel(releases[index - 1]);
}

function getMonthLabel(release: LegacyRelease) {
  const match = release.release_date_calendar.match(/^(\d{4}),(\d{1,2}),(\d{1,2})/);

  if (!match) {
    return "Date TBA";
  }

  const [, year, month] = match.map(Number);

  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}
