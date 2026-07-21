import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getDbUpcomingReleases } from "@/lib/dbReleases";
import type { LegacyRelease } from "@/lib/legacyMobileApi";
import {
  buildMetadata,
  formatReleaseDate,
  getBrandName,
  getReleaseImage,
  getReleaseUrl,
  siteName,
  siteUrl,
} from "@/lib/siteData";

export const metadata: Metadata = buildMetadata({
  title: "Sneaker Release Calendar",
  description:
    "Browse upcoming sneaker release dates by month, including Air Jordan, Nike, adidas, Yeezy, New Balance, and more.",
  path: "/calendar",
});

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  // Upcoming must be filtered in SQL: ordering the whole table by date ASC and
  // taking a page returns the oldest rows (many are epoch-zero placeholders).
  const calendarReleases = await getDbUpcomingReleases(360);
  const releasesByMonth = groupReleasesByMonth(calendarReleases);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${siteName} Sneaker Release Calendar`,
    url: `${siteUrl}/calendar`,
    hasPart: calendarReleases.slice(0, 40).map((release) => ({
      "@type": "Product",
      name: release.name,
      url: `${siteUrl}${getReleaseUrl(release)}`,
      image: getReleaseImage(release),
      sku: release.sku || undefined,
      releaseDate: getIsoReleaseDate(release.release_date_calendar),
    })),
  };

  return (
    <main className="editorial-home calendar-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <header className="ed-masthead">
        <p className="ed-cat">Calendar</p>
        <h1>Release Calendar</h1>
        <p className="ed-deck">
          Every confirmed drop by month, with retail prices, style codes, and a
          straight line into the product page.
        </p>
      </header>

      {releasesByMonth.length ? (
        <nav className="cal-jump" aria-label="Jump to month">
          {releasesByMonth.map((month) => (
            <a href={`#month-${month.key}`} key={month.key}>
              {month.shortLabel}
              <em>{month.releases.length}</em>
            </a>
          ))}
        </nav>
      ) : null}

      <div className="cal-list">
        {releasesByMonth.map((month, monthIndex) => (
          <section className="cal-month" id={`month-${month.key}`} key={month.key}>
            <h2 className="cal-month__title">
              {month.label}
              <span>
                {month.releases.length}{" "}
                {month.releases.length === 1 ? "release" : "releases"}
              </span>
            </h2>

            <ol className="cal-rows">
              {month.releases.map((release, index) => (
                <li key={`${release.product_id}-${release.id}`}>
                  <time
                    className="cal-row__date"
                    dateTime={getIsoReleaseDate(release.release_date_calendar)}
                  >
                    <strong>{getDayNumber(release.release_date_calendar)}</strong>
                    <span>{getWeekday(release.release_date_calendar)}</span>
                  </time>

                  <Link className="cal-row__media" href={getReleaseUrl(release)}>
                    <Image
                      src={getReleaseImage(release)}
                      alt=""
                      width={160}
                      height={160}
                      sizes="120px"
                      priority={monthIndex === 0 && index < 4}
                    />
                  </Link>

                  <div className="cal-row__body">
                    <p className="ed-cat">{getBrandName(release)}</p>
                    <h3>
                      <Link href={getReleaseUrl(release)}>{release.name}</Link>
                    </h3>
                    <p className="cal-row__meta">
                      {formatReleaseDate(release)} · SKU {release.sku || "TBA"}
                    </p>
                  </div>

                  <span className="cal-row__price">{formatPrice(release.price)}</span>
                </li>
              ))}
            </ol>
          </section>
        ))}

        {!releasesByMonth.length ? (
          <section className="cal-month">
            <h2 className="cal-month__title">No upcoming releases found.</h2>
            <p className="ed-deck">
              Check back soon for newly added SoleInsider release dates.
            </p>
          </section>
        ) : null}
      </div>
    </main>
  );
}

type CalendarMonth = {
  key: string;
  label: string;
  shortLabel: string;
  sort: number;
  releases: LegacyRelease[];
};

function groupReleasesByMonth(releases: LegacyRelease[]) {
  const groups = new Map<string, CalendarMonth>();

  for (const release of releases) {
    const month = getMonthInfo(release.release_date_calendar);
    const existing = groups.get(month.key);

    if (existing) {
      existing.releases.push(release);
    } else {
      groups.set(month.key, { ...month, releases: [release] });
    }
  }

  return Array.from(groups.values()).sort((a, b) => a.sort - b.sort);
}

function getMonthInfo(releaseDateCalendar: string) {
  const match = releaseDateCalendar.match(/^(\d{4}),(\d{1,2}),(\d{1,2})/);

  if (!match) {
    return {
      key: "tba",
      label: "Release date TBA",
      shortLabel: "TBA",
      sort: Number.MAX_SAFE_INTEGER,
    };
  }

  const [, year, month] = match.map(Number);
  const date = new Date(year, month - 1, 1);

  return {
    key: `${year}-${String(month).padStart(2, "0")}`,
    label: new Intl.DateTimeFormat("en", {
      month: "long",
      year: "numeric",
    }).format(date),
    shortLabel: new Intl.DateTimeFormat("en", { month: "short" }).format(date),
    sort: date.getTime(),
  };
}

function getDayNumber(releaseDateCalendar: string) {
  const match = releaseDateCalendar.match(/^(\d{4}),(\d{1,2}),(\d{1,2})/);

  return match ? String(Number(match[3])).padStart(2, "0") : "--";
}

function getWeekday(releaseDateCalendar: string) {
  const match = releaseDateCalendar.match(/^(\d{4}),(\d{1,2}),(\d{1,2})/);

  if (!match) {
    return "TBA";
  }

  const [, year, month, day] = match.map(Number);

  return new Intl.DateTimeFormat("en", { weekday: "short" }).format(
    new Date(year, month - 1, day),
  );
}

function getIsoReleaseDate(releaseDateCalendar: string) {
  const match = releaseDateCalendar.match(/^(\d{4}),(\d{1,2}),(\d{1,2})/);

  if (!match) {
    return undefined;
  }

  const [, year, month, day] = match.map(Number);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatPrice(price: string) {
  const value = price.trim();

  if (!value || value === "0") {
    return "TBA";
  }

  return value.startsWith("$") ? value : `$${value}`;
}
