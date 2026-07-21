import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getDbReleasesOnMonthDay } from "@/lib/dbReleases";
import type { LegacyRelease } from "@/lib/legacyMobileApi";
import {
  buildMetadata,
  getAbsoluteReleaseUrl,
  getBrandName,
  getReleaseImage,
  getReleaseUrl,
  siteName,
  siteUrl,
} from "@/lib/siteData";

type OnThisDayPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = buildMetadata({
  title: "On This Day in Sneaker History",
  description:
    "Discover sneakers released on this date throughout SoleInsider history, including release dates, prices, SKUs, and product detail pages.",
  path: "/on-this-day",
});

export const dynamic = "force-dynamic";

const monthOptions = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default async function OnThisDayPage({ searchParams }: OnThisDayPageProps) {
  const params = (await searchParams) ?? {};
  const today = new Date();
  const selectedMonth = getBoundedNumber(params.month, today.getMonth() + 1, 1, 12);
  const selectedDay = getBoundedNumber(params.day, today.getDate(), 1, 31);
  const dbReleases = await getDbReleasesOnMonthDay(selectedMonth, selectedDay);
  const releases = dbReleases ?? [];
  const releasesByYear = groupReleasesByYear(releases);
  const dateLabel = new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
  }).format(new Date(2026, selectedMonth - 1, selectedDay));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${siteName} On This Day: ${dateLabel}`,
    url: `${siteUrl}/on-this-day?month=${selectedMonth}&day=${selectedDay}`,
    hasPart: releases.slice(0, 40).map((release) => ({
      "@type": "Product",
      name: release.name,
      url: getAbsoluteReleaseUrl(release),
      sku: release.sku || undefined,
      category: getBrandName(release),
      releaseDate: getIsoReleaseDate(release.release_date_calendar),
    })),
  };

  return (
    <main className="editorial-home otd-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="ed-masthead">
        <p className="ed-cat">On this day</p>
        <h1>Sneakers released on {dateLabel}.</h1>
        <p className="ed-deck">
          Every drop the archive recorded on this date, newest year first.
        </p>
      </header>

      <section className="otd-controls">
        <form className="otd-picker" action="/on-this-day" method="get">
          <label>
            <span>Month</span>
            <select name="month" defaultValue={selectedMonth}>
              {monthOptions.map((month, index) => (
                <option value={index + 1} key={month}>
                  {month}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Day</span>
            <select name="day" defaultValue={selectedDay}>
              {Array.from({ length: 31 }, (_, index) => index + 1).map((day) => (
                <option value={day} key={day}>
                  {day}
                </option>
              ))}
            </select>
          </label>
          <button type="submit">Show releases</button>
        </form>

        <p className="search-count">
          {releases.length
            ? `${releases.length} ${releases.length === 1 ? "release" : "releases"} across ${releasesByYear.length} ${releasesByYear.length === 1 ? "year" : "years"}`
            : "No releases on this date"}
        </p>
      </section>

      <div className="cal-list">
        {releasesByYear.map((year) => (
          <section className="cal-month" key={year.label}>
            <h2 className="cal-month__title">
              {year.label}
              <span>
                {year.releases.length} {year.releases.length === 1 ? "drop" : "drops"}
              </span>
            </h2>
            <ol className="cal-rows search-results">
              {year.releases.map((release) => (
                <li key={`${release.product_id}-${release.id}`}>
                  <Link className="cal-row__media" href={getReleaseUrl(release)}>
                    <Image
                      src={getReleaseImage(release)}
                      alt=""
                      width={160}
                      height={160}
                      sizes="120px"
                    />
                  </Link>
                  <div className="cal-row__body">
                    <p className="ed-cat">{getBrandName(release)}</p>
                    <h3>
                      <Link href={getReleaseUrl(release)}>{release.name}</Link>
                    </h3>
                    <p className="cal-row__meta">
                      {release.release_date} · SKU {release.sku || "TBA"}
                    </p>
                  </div>
                  <span className="cal-row__price">
                    {release.price && release.price !== "0" ? `$${release.price}` : "TBA"}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        ))}

        {!releasesByYear.length ? (
          <section className="search-empty">
            <h2>No sneakers were released on {dateLabel}.</h2>
            <p className="ed-deck">
              Pick another date above, or browse the full release calendar for
              what is coming next.
            </p>
            <Link className="ed-more" href="/calendar">
              Open the calendar
            </Link>
          </section>
        ) : null}
      </div>
    </main>
  );
}

function getBoundedNumber(
  value: string | string[] | undefined,
  fallback: number,
  min: number,
  max: number,
) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const numberValue = Number.parseInt(rawValue ?? "", 10);

  if (!Number.isFinite(numberValue)) {
    return fallback;
  }

  return Math.min(Math.max(numberValue, min), max);
}

function groupReleasesByYear(releases: LegacyRelease[]) {
  const groups = new Map<string, LegacyRelease[]>();

  for (const release of releases) {
    const year = getReleaseYear(release.release_date_calendar);
    groups.set(year, [...(groups.get(year) ?? []), release]);
  }

  return Array.from(groups.entries())
    .sort(([yearA], [yearB]) => Number(yearB) - Number(yearA))
    .map(([label, yearReleases]) => ({ label, releases: yearReleases }));
}

function getReleaseYear(releaseDateCalendar: string) {
  const match = releaseDateCalendar.match(/^(\d{4})/);
  return match?.[1] ?? "TBA";
}

function getIsoReleaseDate(releaseDateCalendar: string) {
  const match = releaseDateCalendar.match(/^(\d{4}),(\d{1,2}),(\d{1,2})/);

  if (!match) {
    return undefined;
  }

  const [, year, month, day] = match.map(Number);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
