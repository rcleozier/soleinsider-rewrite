import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SearchForm } from "@/components/SearchForm";
import { searchDbReleasesForPage } from "@/lib/dbReleases";
import {
  buildMetadata,
  formatReleaseDate,
  getBrandName,
  getReleaseImage,
  getReleaseUrl,
} from "@/lib/siteData";

type SearchPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams;
  const query = q?.trim();

  return buildMetadata({
    title: query ? `Search results for “${query}”` : "Search Sneaker Releases",
    description:
      "Search the SoleInsider release archive by model, brand, colorway, or style code.",
    path: query ? `/search?q=${encodeURIComponent(query)}` : "/search",
  });
}

export const dynamic = "force-dynamic";

const suggestions = ["Air Jordan 1", "Yeezy", "adidas Samba", "New Balance 990", "Dunk Low"];

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const results = query ? await searchDbReleasesForPage(query, 60) : [];

  return (
    <main className="editorial-home search-page">
      <header className="ed-masthead">
        <p className="ed-cat">Search</p>
        <h1>{query ? `Results for “${query}”` : "Search releases"}</h1>
        <p className="ed-deck">
          Search the full SoleInsider archive by model, brand, colorway, or
          style code.
        </p>
      </header>

      <section className="search-panel">
        <SearchForm initialQuery={query} />

        {!query ? (
          <div className="search-suggestions">
            <span>Try</span>
            {suggestions.map((suggestion) => (
              <Link href={`/search?q=${encodeURIComponent(suggestion)}`} key={suggestion}>
                {suggestion}
              </Link>
            ))}
          </div>
        ) : (
          <p className="search-count">
            {results.length
              ? `${results.length}${results.length === 60 ? "+" : ""} ${
                  results.length === 1 ? "release" : "releases"
                }`
              : "No matches"}
          </p>
        )}
      </section>

      <div className="cal-list">
        {results.length ? (
          <ol className="cal-rows search-results">
            {results.map((release) => (
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
                  <h2>
                    <Link href={getReleaseUrl(release)}>{release.name}</Link>
                  </h2>
                  <p className="cal-row__meta">
                    {formatReleaseDate(release)} · SKU {release.sku || "TBA"}
                  </p>
                </div>

                <span className="cal-row__price">{formatPrice(release.price)}</span>
              </li>
            ))}
          </ol>
        ) : null}

        {query && !results.length ? (
          <section className="search-empty">
            <h2>Nothing matched “{query}”.</h2>
            <p className="ed-deck">
              Try a shorter phrase, a brand name, or a style code. You can also
              browse the full release calendar.
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

function formatPrice(price: string) {
  const value = price.trim();

  if (!value || value === "0") {
    return "TBA";
  }

  return value.startsWith("$") ? value : `$${value}`;
}
