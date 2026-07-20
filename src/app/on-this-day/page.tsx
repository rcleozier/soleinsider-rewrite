import type { Metadata } from "next";
import Link from "next/link";
import { ReleaseCard } from "@/components/ReleaseCard";
import { getDbReleasesOnMonthDay } from "@/lib/dbReleases";
import type { LegacyRelease } from "@/lib/legacyMobileApi";
import {
  buildMetadata,
  getAbsoluteReleaseUrl,
  getBrandName,
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
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="subpage-hero on-this-day-hero">
        <p className="kicker">On This Day</p>
        <h1>Sneakers released on {dateLabel}.</h1>
        <p>
          Explore SoleInsider release history by month and day, then open local
          product pages for prices, SKUs, images, comments, and COP/DROP data.
        </p>

        <form className="date-picker-panel" action="/on-this-day" method="get">
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
          <button type="submit">Search</button>
        </form>
      </section>

      <section className="content-band on-this-day-results" aria-labelledby="on-this-day-results-title">
        <div className="section-heading">
          <div>
            <p className="kicker">{dateLabel}</p>
            <h2 id="on-this-day-results-title">
              {releases.length
                ? `${releases.length} release${releases.length === 1 ? "" : "s"} from the archive.`
                : "No releases found."}
            </h2>
          </div>
          <p>
            Results are grouped from newest to oldest so collectors can scan
            recent drops first while still moving through the deeper archive.
          </p>
        </div>

        {releasesByYear.length ? (
          <div className="on-this-day-year-list">
            {releasesByYear.map((year) => (
              <section className="on-this-day-year" key={year.label}>
                <div className="on-this-day-year__header">
                  <h3>{year.label}</h3>
                  <span>{year.releases.length} drops</span>
                </div>
                <div className="release-grid">
                  {year.releases.map((release) => (
                    <ReleaseCard release={release} key={`${release.product_id}-${release.id}`} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="on-this-day-empty">
            <p className="kicker">Try another day</p>
            <h2>No sneakers were released on this date.</h2>
            <p>
              Pick a different month and day, or browse the full release
              calendar for upcoming launches.
            </p>
            <Link href="/calendar">Open Release Calendar</Link>
          </div>
        )}
      </section>

      <section className="on-this-day-explainer" aria-labelledby="on-this-day-explainer-title">
        <div>
          <p className="kicker">Explore Sneaker History</p>
          <h2 id="on-this-day-explainer-title">Search the archive by date.</h2>
          <p>
            SoleInsider keeps older release pages useful for collectors coming
            from Google, mobile app users revisiting past launches, and anyone
            checking a SKU or release anniversary.
          </p>
        </div>
        <div className="on-this-day-facts">
          <article>
            <h3>Historical Data</h3>
            <p>Browse release history from the legacy SoleInsider archive.</p>
          </article>
          <article>
            <h3>Product Details</h3>
            <p>Open local release pages with images, prices, SKUs, and voting.</p>
          </article>
          <article>
            <h3>Market Context</h3>
            <p>Use COP/DROP and pricing signals when data is available.</p>
          </article>
        </div>
      </section>
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
