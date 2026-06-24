import type { Metadata } from "next";
import Link from "next/link";
import { getAllReleases } from "@/lib/legacyMobileApi";
import {
  buildMetadata,
  formatReleaseDate,
  getBrandName,
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

export default function CalendarPage() {
  const releasesByMonth = getAllReleases().reduce<Record<string, ReturnType<typeof getAllReleases>>>(
    (groups, release) => {
      const month = getMonthLabel(release.release_date_calendar);
      groups[month] = [...(groups[month] ?? []), release];
      return groups;
    },
    {},
  );
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${siteName} Sneaker Release Calendar`,
    url: `${siteUrl}/calendar`,
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="subpage-hero">
        <p className="kicker">Calendar</p>
        <h1>Sneaker release calendar.</h1>
        <p>
          Track upcoming drops by month with release dates, retail prices, SKU
          data, and direct product pages for the mobile app and web rewrite.
        </p>
      </section>

      <section className="content-band">
        <div className="calendar-list">
          {Object.entries(releasesByMonth).map(([month, releases]) => (
            <section key={month}>
              <h2>{month}</h2>
              <div>
                {releases.map((release) => (
                  <article key={release.id}>
                    <time>{formatReleaseDate(release)}</time>
                    <h3>
                      <Link href={getReleaseUrl(release)}>{release.name}</Link>
                    </h3>
                    <p>
                      {getBrandName(release)} / SKU {release.sku || "TBA"} / $
                      {release.price}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}

function getMonthLabel(releaseDateCalendar: string) {
  const match = releaseDateCalendar.match(/^(\d{4}),(\d{1,2}),(\d{1,2})/);

  if (!match) {
    return "Release date TBA";
  }

  const [, year, month] = match.map(Number);

  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}
