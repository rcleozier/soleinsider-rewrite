import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { HeroSearch } from "@/components/HeroSearch";
import type { ArticleRecord } from "@/lib/dbArticles";
import { getDbArticles } from "@/lib/dbArticles";
import type { LegacyRelease } from "@/lib/legacyMobileApi";
import {
  getDbSneakerReleasesRecentlyAdded,
  getDbUpcomingReleases,
} from "@/lib/dbReleases";
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

type FeedItem = {
  key: string;
  href: string;
  image: string;
  category: string;
  title: string;
  deck: string;
  meta: string;
  timestamp: number;
};

export default async function Home() {
  const [dbReleases, dbUpcoming, dbArticles] = await Promise.all([
    getDbSneakerReleasesRecentlyAdded(48),
    getDbUpcomingReleases(20),
    getDbArticles(40),
  ]);
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

  const articleItems = dbArticles.map(articleToFeedItem);
  const releaseItems = releases.map(releaseToFeedItem);

  // The lead mosaic prefers editorial coverage, then falls back to release data
  // so the homepage never renders empty while the article table backfills.
  const mosaicSource = articleItems.length >= 3 ? articleItems : releaseItems;
  const [leadItem, ...mosaicRest] = mosaicSource;
  const mosaicSide = mosaicRest.slice(0, 2);
  const usedKeys = new Set([leadItem?.key, ...mosaicSide.map((item) => item.key)]);

  // "Dropping next" is the priority feed: soonest upcoming release date first,
  // falling back to most recently added once nothing upcoming is left.
  const upcomingFeed = dbUpcoming
    .filter((release) => !usedKeys.has(releaseKey(release)))
    .map(releaseToFeedItem)
    .slice(0, 10);
  const latestFeed = upcomingFeed.length
    ? upcomingFeed
    : releaseItems.filter((item) => !usedKeys.has(item.key)).slice(0, 10);
  const latestKeys = new Set(latestFeed.map((item) => item.key));

  // The strip fills from what the lead and the drop feed have not claimed.
  const strip = releaseItems
    .filter((item) => !usedKeys.has(item.key) && !latestKeys.has(item.key))
    .slice(0, 4);
  strip.forEach((item) => usedKeys.add(item.key));

  const popularFeed = releases
    .filter(
      (release) =>
        !usedKeys.has(releaseKey(release)) && !latestKeys.has(releaseKey(release)),
    )
    .slice()
    .sort((a, b) => getTotalVotes(b) - getTotalVotes(a))
    .slice(0, 8);

  const calendarPreview = getCalendarPreview(releases, heroRelease);
  const brandRanking = getBrandRanking(releases);
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
        itemListElement: releases.slice(0, 10).map((release, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: getAbsoluteReleaseUrl(release),
          name: release.name,
        })),
      },
    ],
  };

  return (
    <main className="front-page editorial-home">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <h1 className="ed-sr-only">
        SoleInsider — sneaker release dates, drops, and culture
      </h1>

      {leadItem ? (
        <section className="ed-mosaic" aria-label="Lead stories">
          <article className="ed-lead">
            <Link href={leadItem.href} className="ed-lead__media">
              <FeedImage item={leadItem} priority sizes="(max-width: 900px) 100vw, 62vw" />
            </Link>
            <div className="ed-lead__body">
              <p className="ed-cat">{leadItem.category}</p>
              <h2>
                <Link href={leadItem.href}>{leadItem.title}</Link>
              </h2>
              <p className="ed-deck">{leadItem.deck}</p>
              <p className="ed-byline">{leadItem.meta}</p>
            </div>
          </article>

          <div className="ed-mosaic__side">
            {mosaicSide.map((item) => (
              <article className="ed-side" key={item.key}>
                <Link href={item.href} className="ed-side__media">
                  <FeedImage item={item} sizes="(max-width: 900px) 50vw, 19vw" />
                </Link>
                <p className="ed-cat">{item.category}</p>
                <h3>
                  <Link href={item.href}>{item.title}</Link>
                </h3>
                <p className="ed-byline">{item.meta}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {strip.length ? (
        <section className="ed-strip" aria-label="More drops">
          {strip.map((item) => (
            <article key={item.key}>
              <Link href={item.href} className="ed-strip__media">
                <FeedImage item={item} sizes="(max-width: 900px) 50vw, 24vw" />
              </Link>
              <p className="ed-cat">{item.category}</p>
              <h3>
                <Link href={item.href}>{item.title}</Link>
              </h3>
              <p className="ed-byline">{item.meta}</p>
            </article>
          ))}
        </section>
      ) : null}

      <div className="ed-body">
        <section className="ed-column" aria-labelledby="ed-latest-title">
          <h2 className="ed-column__title" id="ed-latest-title">
            Dropping next
          </h2>
          <div className="ed-feed">
            {latestFeed.map((item) => (
              <article className="ed-row" key={item.key}>
                <div className="ed-row__body">
                  <p className="ed-cat">{item.category}</p>
                  <h3>
                    <Link href={item.href}>{item.title}</Link>
                  </h3>
                  <p className="ed-deck">{item.deck}</p>
                  <p className="ed-byline">{item.meta}</p>
                </div>
                <Link href={item.href} className="ed-row__media">
                  <FeedImage item={item} sizes="(max-width: 900px) 34vw, 15vw" />
                </Link>
              </article>
            ))}
          </div>
          <Link className="ed-more" href="/calendar">
            View all releases
          </Link>
        </section>

        <section className="ed-column ed-column--popular" aria-labelledby="ed-popular-title">
          <h2 className="ed-column__title" id="ed-popular-title">
            Popular
          </h2>
          <ol className="ed-popular">
            {popularFeed.map((release, index) => (
              <li key={release.id}>
                <span className="ed-popular__rank">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <Link href={getReleaseUrl(release)} className="ed-popular__media">
                  <Image
                    src={getReleaseImage(release)}
                    alt=""
                    fill
                    sizes="(max-width: 900px) 25vw, 10vw"
                  />
                </Link>
                <div>
                  <p className="ed-cat">{getBrandName(release)}</p>
                  <h3>
                    <Link href={getReleaseUrl(release)}>{release.name}</Link>
                  </h3>
                  <p className="ed-byline">
                    {formatReleaseDate(release)} · {formatRetailPrice(release.price)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <aside className="ed-rail" aria-label="Release desk">
          <div className="ed-rail__inner">
            <section className="ed-module ed-module--search">
              <HeroSearch />
            </section>

            <section className="ed-module">
              <h2>Brand ranking</h2>
              <ol className="ed-ranking">
                {brandRanking.map((brand, index) => (
                  <li key={brand.name}>
                    <span>{index + 1}</span>
                    <strong>{brand.name}</strong>
                    <em>{brand.count}</em>
                  </li>
                ))}
              </ol>
            </section>

            <section className="ed-module">
              <h2>Release calendar</h2>
              <ul className="ed-calendar">
                {calendarPreview.map((release) => (
                  <li key={release.id}>
                    <time>{formatReleaseDate(release)}</time>
                    <Link href={getReleaseUrl(release)}>{release.name}</Link>
                    <span>
                      {getBrandName(release)} · {formatRetailPrice(release.price)}
                    </span>
                  </li>
                ))}
              </ul>
              <Link className="ed-more" href="/calendar">
                Open calendar
              </Link>
            </section>

            <section className="ed-module ed-module--app">
              <h2>Release reminders</h2>
              <p>
                Alerts, tracking, comments, and COP/DROP voting in the
                SoleInsider app.
              </p>
              <a href={appStoreUrl}>App Store</a>
              <a href={googlePlayUrl}>Google Play</a>
            </section>
          </div>
        </aside>
      </div>

      <section className="homepage-seo-block" aria-labelledby="homepage-seo-title">
        <p className="kicker">Sneaker release dates</p>
        <h2 id="homepage-seo-title">
          SoleInsider tracks release dates, SKUs, prices, and archives.
        </h2>
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

function FeedImage({
  item,
  priority,
  sizes,
}: {
  item: FeedItem;
  priority?: boolean;
  sizes: string;
}) {
  // Legacy article covers can point at arbitrary historical CDN hosts, so those
  // bypass next/image while release imagery keeps optimization.
  if (item.key.startsWith("article-")) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={item.image} alt="" loading={priority ? "eager" : "lazy"} />;
  }

  return <Image src={item.image} alt="" fill sizes={sizes} priority={priority} />;
}

function articleToFeedItem(article: ArticleRecord): FeedItem {
  const timestamp = Date.parse(`${article.date}T12:00:00`);

  return {
    key: `article-${article.id}`,
    href: article.legacyUrl || `/article/${article.slug}`,
    image: article.image,
    category: article.category || "Stories",
    title: article.title,
    deck: article.deck,
    meta: `By ${article.author}`,
    timestamp: Number.isNaN(timestamp) ? 0 : timestamp,
  };
}

function releaseToFeedItem(release: LegacyRelease): FeedItem {
  return {
    key: releaseKey(release),
    href: getReleaseUrl(release),
    image: getReleaseImage(release),
    category: getBrandName(release),
    title: release.name,
    deck:
      cleanHtmlContent(release.content).slice(0, 140) ||
      `Releasing ${formatReleaseDate(release)} for ${formatRetailPrice(release.price)}${
        release.sku ? ` under style code ${release.sku}` : ""
      }.`,
    meta: `${formatReleaseDate(release)} · ${formatRetailPrice(release.price)}`,
    timestamp: getCreatedTimestamp(release),
  };
}

function releaseKey(release: LegacyRelease) {
  return `release-${release.product_id}`;
}

function getBrandRanking(releases: LegacyRelease[]) {
  const counts = new Map<string, number>();

  for (const release of releases) {
    const brand = getBrandName(release);
    counts.set(brand, (counts.get(brand) ?? 0) + 1);
  }

  return Array.from(counts, ([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 8);
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

function getCalendarPreview(releases: LegacyRelease[], fallback: LegacyRelease) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcoming = releases
    .filter((release) => getReleaseTimestamp(release) >= today.getTime())
    .sort((a, b) => getReleaseTimestamp(a) - getReleaseTimestamp(b))
    .slice(0, 6);

  return upcoming.length ? upcoming : releases.slice(0, 6).concat(fallback).slice(0, 6);
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

function formatRetailPrice(price: string) {
  const numericPrice = Number(price);

  if (!Number.isFinite(numericPrice) || numericPrice <= 0) return "TBA";

  return `$${numericPrice.toLocaleString()}`;
}

function getTotalVotes(release: LegacyRelease) {
  return Number(release.yes_votes) + Number(release.no_votes);
}
