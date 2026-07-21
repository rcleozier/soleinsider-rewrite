"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type SearchResult = {
  id: string;
  name: string;
  sku?: string | null;
  price?: string | null;
  release_date?: string | null;
  product_url?: string | null;
  slug?: string | null;
  product_id?: string | null;
};

export function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const trimmedQuery = query.trim();

  useEffect(() => {
    if (trimmedQuery.length < 2) {
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setStatus("loading");

      try {
        const response = await fetch(
          `/mobileapi/search?search=${encodeURIComponent(trimmedQuery)}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error(`Search failed with status ${response.status}`);
        }

        const data = (await response.json()) as SearchResult[];
        setResults(data.slice(0, 6));
        setStatus("ready");
      } catch (error) {
        if (!controller.signal.aborted) {
          console.warn("Homepage search failed.", error);
          setResults([]);
          setStatus("error");
        }
      }
    }, 220);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [trimmedQuery]);

  const helperText = useMemo(() => {
    if (status === "loading") return "Searching release archive...";
    if (status === "error") return "Search is unavailable. Browse newest releases below.";
    if (trimmedQuery.length >= 2 && results.length === 0 && status === "ready") {
      return "No matches yet. Try a brand, SKU, or model name.";
    }

    return "Try Jordan, adidas, Yeezy, SKU codes, or colorways.";
  }, [results.length, status, trimmedQuery.length]);

  function handleQueryChange(value: string) {
    setQuery(value);

    if (value.trim().length < 2) {
      setResults([]);
      setStatus("idle");
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (trimmedQuery) {
      router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`);
    }
  }

  return (
    <form className="hero-search" onSubmit={handleSubmit} role="search">
      <label htmlFor="homepage-release-search">Search the archive</label>
      <div className="hero-search__field">
        <input
          id="homepage-release-search"
          type="search"
          value={query}
          onChange={(event) => handleQueryChange(event.target.value)}
          placeholder="Search releases, brands, SKUs..."
          autoComplete="off"
        />
        <button type="submit">GO</button>
      </div>
      <p>{helperText}</p>
      {trimmedQuery.length >= 2 && results.length ? (
        <div className="hero-search__results" aria-label="Search results">
          {results.map((result) => (
            <Link href={getSearchResultHref(result)} key={`${result.id}-${result.product_id}`}>
              <strong>{result.name}</strong>
              <span>
                {result.release_date || "Release date TBA"} / SKU {result.sku || "TBA"} / $
                {result.price || "TBA"}
              </span>
            </Link>
          ))}
        </div>
      ) : null}
    </form>
  );
}

function getSearchResultHref(result: SearchResult) {
  if (result.slug && result.product_id) return `/${result.slug}/${result.product_id}`;
  if (result.product_url) {
    try {
      const url = new URL(result.product_url);

      return `${url.pathname}${url.search}${url.hash}`;
    } catch {
      return result.product_url;
    }
  }

  return "/";
}
