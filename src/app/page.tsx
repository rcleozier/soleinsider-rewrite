import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CountdownModule } from "@/components/CountdownModule";
import { CopDropButtons } from "@/components/CopDropButtons";
import { getAllReleases } from "@/lib/legacyMobileApi";
import {
  articles,
  appStoreUrl,
  buildMetadata,
  cleanHtmlContent,
  formatReleaseDate,
  getBrandName,
  getReleaseImage,
  getReleaseUrl,
  siteName,
  siteUrl,
} from "@/lib/siteData";

export const metadata: Metadata = buildMetadata({
  title: "Sneaker Release Dates",
  description:
    "Upcoming sneaker release dates, Air Jordan launches, Nike drops, Yeezy news, retail prices, and editorial sneaker stories.",
  path: "/",
});

export default function Home() {
  const releases = getAllReleases();
  const featuredRelease = releases[0];
  const secondaryRelease = releases[1];
  const storyImageReleases = releases.slice(1);
  const sidebarArticle = articles[1];
  const sidebarImageRelease = storyImageReleases[0] ?? featuredRelease;
  const latestStories = [
    {
      type: "Release",
      title: `${featuredRelease.name} lands on the SoleInsider calendar`,
      deck:
        cleanHtmlContent(featuredRelease.content) ||
        `${featuredRelease.name} is scheduled for ${formatReleaseDate(featuredRelease)} with a retail price of $${featuredRelease.price}.`,
      href: getReleaseUrl(featuredRelease),
      image: getReleaseImage(featuredRelease),
      date: formatReleaseDate(featuredRelease),
    },
    ...articles.map((article, index) => {
      const imageRelease =
        storyImageReleases[index % storyImageReleases.length] ??
        featuredRelease;

      return {
        type: article.category,
        title: article.title,
        deck: article.deck,
        href: `/articles/${article.slug}`,
        image: getReleaseImage(imageRelease),
        date: new Intl.DateTimeFormat("en", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }).format(new Date(`${article.date}T12:00:00`)),
      };
    }),
    ...releases.slice(1).map((release) => ({
      type: getBrandName(release),
      title: `${release.name} release date and retail price`,
      deck: `${release.name} is listed for ${formatReleaseDate(
        release,
      )} at $${release.price}. SKU ${release.sku || "TBA"}.`,
      href: getReleaseUrl(release),
      image: getReleaseImage(release),
      date: formatReleaseDate(release),
    })),
  ];
  const ranking = releases
    .slice()
    .sort((a, b) => Number(b.yes_votes) - Number(a.yes_votes))
    .slice(0, 5);
  const releaseItemList = releases.map((release, index) => ({
    "@type": "ListItem",
    position: index + 1,
    url: getReleaseUrl(release),
    name: release.name,
  }));
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
        name: "Upcoming sneaker release dates",
        itemListElement: releaseItemList,
      },
    ],
  };

  return (
    <main className="front-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="alert-banner" aria-label="New drop alert">
        <span aria-hidden="true" />
        <p>2 new drops since your last visit. Check pricing and reminders.</p>
        <button type="button" aria-label="Dismiss alert">
          ×
        </button>
      </section>

      <section className="front-lead" aria-labelledby="front-lead-title">
        <article className="lead-copy">
          <p className="kicker">Sneaker release dates</p>
          <h1 id="front-lead-title">
            The week&apos;s biggest drops, prices, and buyer signals.
          </h1>
          <p>
            SoleInsider tracks Air Jordan, Nike, adidas, Yeezy, New Balance,
            and streetwear launches with release dates, SKU data, market notes,
            and mobile app voting.
          </p>
          <Link href="#upcoming-releases">Scan the calendar</Link>
        </article>

        <article className="lead-visual">
          <Link href={getReleaseUrl(featuredRelease)} className="lead-image">
            <Image
              src={getReleaseImage(featuredRelease)}
              alt={`${featuredRelease.name} release`}
              fill
              sizes="(max-width: 980px) 100vw, 50vw"
              priority
              loading="eager"
            />
            <span className="drop-badge">Top Drop</span>
          </Link>
          <div className="lead-visual__caption">
            <p>{getBrandName(featuredRelease)} / {formatReleaseDate(featuredRelease)}</p>
            <h2>
              <Link href={getReleaseUrl(featuredRelease)}>
                {featuredRelease.name}
              </Link>
            </h2>
            <span>${featuredRelease.price} retail</span>
            <CopDropButtons release={featuredRelease} />
          </div>
        </article>

        <aside className="lead-side">
          <Link href={`/articles/${sidebarArticle.slug}`} className="lead-side__image">
            <Image
              src={getReleaseImage(sidebarImageRelease)}
              alt=""
              fill
              sizes="(max-width: 980px) 100vw, 24vw"
            />
          </Link>
          <p className="kicker">{sidebarArticle.category}</p>
          <h2>
            <Link href={`/articles/${sidebarArticle.slug}`}>
              {sidebarArticle.title}
            </Link>
          </h2>
          <p>{sidebarArticle.deck}</p>
        </aside>
      </section>

      <section className="drop-rail" aria-label="Upcoming drops">
        <div>
          <p className="kicker">Upcoming Drops</p>
          <h2>Watchlist</h2>
        </div>
        <div className="drop-rail__list">
          {releases.map((release) => (
            <Link href={getReleaseUrl(release)} key={release.id}>
              <span>
                <Image
                  src={getReleaseImage(release)}
                  alt=""
                  fill
                  sizes="96px"
                />
              </span>
              <strong>{getBrandName(release)}</strong>
            </Link>
          ))}
        </div>
      </section>

      <section className="top-stories" aria-label="Top sneaker stories">
        {[
          ...releases.slice(1, 4).map((release) => ({
            title: release.name,
            href: getReleaseUrl(release),
            image: getReleaseImage(release),
            label: formatReleaseDate(release),
          })),
          {
            title: articles[0].title,
            href: `/articles/${articles[0].slug}`,
            image: getReleaseImage(storyImageReleases[3] ?? featuredRelease),
            label: articles[0].category,
          },
        ].map((item) => (
          <article className="top-story" key={item.href}>
            <Link href={item.href} className="top-story__image">
              <Image src={item.image} alt="" fill sizes="25vw" />
            </Link>
            <p>{item.label}</p>
            <h2>
              <Link href={item.href}>{item.title}</Link>
            </h2>
          </article>
        ))}
      </section>

      <section className="ad-banner" aria-label="SoleInsider app promotion">
        <div>
          <p>Everything you need before checkout.</p>
          <a href={appStoreUrl}>Get release alerts</a>
        </div>
        <span>SKU watch / COP-DROP / reminders / stories</span>
      </section>

      <section className="news-shell" id="upcoming-releases">
        <div className="section-tabs" aria-label="Story filters">
          <span>Latest</span>
          <span>Popular</span>
        </div>

        <div className="news-layout">
          <section className="story-feed" aria-label="Latest sneaker coverage">
            {latestStories.map((story) => (
              <article className="story-row" key={story.href}>
                <div className="story-row__copy">
                  <p className="kicker">{story.type}</p>
                  <h2>
                    <Link href={story.href}>{story.title}</Link>
                  </h2>
                  <p>{story.deck}</p>
                  <footer>
                    <span>By SoleInsider</span>
                    <time>{story.date}</time>
                  </footer>
                </div>
                <Link href={story.href} className="story-row__image">
                  <Image src={story.image} alt="" fill sizes="(max-width: 980px) 100vw, 34vw" />
                </Link>
              </article>
            ))}
          </section>

          <aside className="side-rail">
            <section className="rail-promo">
              <p>Never miss a drop</p>
              <a href={appStoreUrl}>Download the app</a>
            </section>

            <section className="ranking-card">
              <h2>Release Ranking</h2>
              <ol>
                {ranking.map((release, index) => (
                  <li key={release.id}>
                    <span>{index + 1}</span>
                    <Link href={getReleaseUrl(release)}>
                      {release.name}
                    </Link>
                    <strong>{release.yes_votes}</strong>
                  </li>
                ))}
              </ol>
            </section>

            <section className="quick-card">
              <h2>On This Day</h2>
              <p>
                Browse historical launches by date using the same mobile API
                route powering the app.
              </p>
              <Link href="/mobileapi/onThisDate?date=06-22">View sample JSON</Link>
            </section>
          </aside>
        </div>
      </section>

      <section className="release-strip">
        <div>
          <p className="kicker">Next key release</p>
          <h2>{secondaryRelease.name}</h2>
          <p>
            {formatReleaseDate(secondaryRelease)} / {getBrandName(secondaryRelease)} / $
            {secondaryRelease.price}
          </p>
        </div>
        <CountdownModule releaseDateCalendar={secondaryRelease.release_date_calendar} />
        <Link href={getReleaseUrl(secondaryRelease)}>Full release info</Link>
      </section>

      <section className="bottom-billboard">
        <div>
          <h2>When the raffle opens, know before the crowd.</h2>
          <p>Calendar alerts, story context, and mobile-first release data.</p>
        </div>
      </section>
    </main>
  );
}
